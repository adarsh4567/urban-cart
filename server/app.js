import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeUser, error } from "./store.js";

const secret =
  process.env.JWT_SECRET || "urbancart-local-demo-secret-change-in-production";
const text = (v, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const requireText = (v, label, max) => {
  const s = text(v, max);
  if (!s) throw error(`${label} is required`);
  return s;
};
const nonnegative = (v, label) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0)
    throw error(`${label} must be a non-negative number`);
  return n;
};
const integer = (v, label) => {
  const n = nonnegative(v, label);
  if (!Number.isInteger(n)) throw error(`${label} must be an integer`);
  return n;
};
const statuses = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];

function bookInput(body, partial = false) {
  const out = {};
  for (const field of ["title", "author", "isbn", "category"])
    if (!partial || body[field] !== undefined)
      out[field] = requireText(body[field], field, 160);
  for (const field of ["publisher", "cover", "description"])
    if (body[field] !== undefined)
      out[field] = text(body[field], field === "description" ? 2000 : 500);
  for (const field of ["price", "stock", "year"])
    if (!partial || body[field] !== undefined)
      out[field] =
        field === "price"
          ? nonnegative(body[field], field)
          : integer(body[field], field);
  if (out.isbn && !/^[0-9Xx-]{10,17}$/.test(out.isbn))
    throw error("ISBN must contain 10 or 13 digits");
  return out;
}
function addressInput(body) {
  const a = {};
  for (const [key, label] of [
    ["fullName", "Full name"],
    ["line1", "Street address"],
    ["city", "City"],
    ["state", "State"],
    ["postalCode", "Postal code"],
    ["phone", "Phone"],
  ])
    a[key] = requireText(body?.[key], label, 160);
  if (!/^[0-9+() -]{8,20}$/.test(a.phone))
    throw error("Enter a valid phone number");
  if (!/^[A-Za-z0-9 -]{4,12}$/.test(a.postalCode))
    throw error("Enter a valid postal code");
  return a;
}

export function createApp(store) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  const auth = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer /i, "");
      if (!token) throw error("Sign in required", 401);
      const payload = jwt.verify(token, secret);
      const user = await store.findUserById(payload.sub);
      if (!user) throw error("Account not found", 401);
      req.user = safeUser(user);
      next();
    } catch (e) {
      next(e.status ? e : error("Invalid or expired session", 401));
    }
  };
  const admin = (req, res, next) =>
    req.user.role === "admin"
      ? next()
      : next(error("Administrator access required", 403));
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, mode: process.env.MONGODB_URI ? "mongodb" : "demo" }),
  );
  app.post("/api/auth/register", async (req, res) => {
    const name = requireText(req.body.name, "Name", 80),
      email = text(req.body.email, 120).toLowerCase(),
      password = String(req.body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw error("Enter a valid email");
    if (password.length < 8)
      throw error("Password must be at least 8 characters");
    const user = await store.createUser({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
    });
    res
      .status(201)
      .json({
        user,
        token: jwt.sign({ sub: user.id }, secret, { expiresIn: "7d" }),
      });
  });
  app.post("/api/auth/login", async (req, res) => {
    const user = await store.findUserByEmail(text(req.body.email, 120));
    if (
      !user ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        user.passwordHash,
      ))
    )
      throw error("Invalid email or password", 401);
    const publicUser = safeUser(user);
    res.json({
      user: publicUser,
      token: jwt.sign({ sub: publicUser.id }, secret, { expiresIn: "7d" }),
    });
  });
  app.get("/api/auth/me", auth, (req, res) => res.json({ user: req.user }));
  app.get("/api/categories", async (_req, res) =>
    res.json({ categories: await store.categoriesList() }),
  );
  app.get("/api/books", async (req, res) =>
    res.json(await store.listBooks(req.query)),
  );
  app.get("/api/books/:id", async (req, res) =>
    res.json({ book: await store.getBook(req.params.id) }),
  );
  app.get("/api/cart", auth, async (req, res) =>
    res.json(await store.getCart(req.user.id)),
  );
  app.put("/api/cart/:bookId", auth, async (req, res) =>
    res.json(
      await store.setCartItem(
        req.user.id,
        req.params.bookId,
        req.body.quantity,
      ),
    ),
  );
  app.delete("/api/cart/:bookId", auth, async (req, res) =>
    res.json(await store.removeCartItem(req.user.id, req.params.bookId)),
  );
  app.post("/api/checkout", auth, async (req, res) =>
    res
      .status(201)
      .json({
        order: await store.checkout(
          req.user.id,
          addressInput(req.body.address),
        ),
      }),
  );
  app.get("/api/orders", auth, async (req, res) =>
    res.json({ orders: await store.listOrders(req.user.id) }),
  );
  app.get("/api/admin/books", auth, admin, async (_req, res) =>
    res.json({ books: await store.listAllBooks() }),
  );
  app.get("/api/admin/orders", auth, admin, async (req, res) =>
    res.json({ orders: await store.listOrders(req.user.id, true) }),
  );
  app.patch("/api/admin/orders/:id", auth, admin, async (req, res) => {
    const status = text(req.body.status);
    if (!statuses.includes(status)) throw error("Invalid order status");
    res.json({ order: await store.updateOrderStatus(req.params.id, status) });
  });
  app.post("/api/admin/categories", auth, admin, async (req, res) =>
    res
      .status(201)
      .json({
        name: await store.createCategory(
          requireText(req.body.name, "Category name", 80),
        ),
      }),
  );
  app.patch("/api/admin/categories/:name", auth, admin, async (req, res) =>
    res.json({
      name: await store.updateCategory(
        req.params.name,
        requireText(req.body.name, "Category name", 80),
      ),
    }),
  );
  app.delete("/api/admin/categories/:name", auth, admin, async (req, res) => {
    await store.deleteCategory(req.params.name);
    res.status(204).end();
  });
  app.post("/api/admin/books", auth, admin, async (req, res) =>
    res.status(201).json({ book: await store.createBook(bookInput(req.body)) }),
  );
  app.patch("/api/admin/books/:id", auth, admin, async (req, res) =>
    res.json({
      book: await store.updateBook(req.params.id, bookInput(req.body, true)),
    }),
  );
  app.delete("/api/admin/books/:id", auth, admin, async (req, res) => {
    await store.deleteBook(req.params.id);
    res.status(204).end();
  });
  const dist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist",
  );
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.use((req, res, next) =>
      req.method === "GET" &&
      req.accepts("html") &&
      !req.path.startsWith("/api/")
        ? res.sendFile(path.join(dist, "index.html"))
        : next(),
    );
  }
  app.use((err, _req, res, _next) => {
    if (err.name === "ValidationError")
      return res.status(400).json({ error: err.message });
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "A record with that value already exists" });
    if (!err.status) console.error(err);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Server error" });
  });
  return app;
}
