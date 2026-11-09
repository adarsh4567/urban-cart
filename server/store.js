import fs from "node:fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, Category, Book, Cart, Order } from "./models.js";

const seed = JSON.parse(
  fs.readFileSync(new URL("./data/books.json", import.meta.url)),
);
const initialCategories = [
  "Classics",
  "Fantasy",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Young Adult",
];
const clean = (value) =>
  JSON.parse(JSON.stringify(value?.toObject ? value.toObject() : value));
const id = () => crypto.randomUUID();
const error = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const safeUser = (u) => ({
  id: String(u._id || u.id),
  name: u.name,
  email: u.email,
  role: u.role,
});
const bookOut = (b) => ({
  ...clean(b),
  id: String(b._id || b.id),
  _id: undefined,
  __v: undefined,
});
const orderOut = (o) => {
  const raw = clean(o);
  return {
    ...raw,
    id: String(o._id || o.id),
    _id: undefined,
    __v: undefined,
    user: String(o.user),
    items: raw.items.map((i) => ({ ...i, book: String(i.book) })),
  };
};
const validQuantity = (q) => Number.isInteger(q) && q >= 1 && q <= 99;

export async function createStore(uri) {
  if (uri) {
    const hostname = new URL(uri).hostname;
    const remoteDatabase = !["localhost", "127.0.0.1", "::1"].includes(hostname);
    const databaseName =
      process.env.MONGODB_DB_NAME || new URL(uri).pathname.slice(1) || "urbancart";
    await mongoose.connect(uri, { dbName: databaseName });
    await Promise.all([
      User.init(),
      Category.init(),
      Book.init(),
      Cart.init(),
      Order.init(),
    ]);
    if ((await Book.countDocuments()) === 0) {
      await Category.insertMany(initialCategories.map((name) => ({ name })));
      await Book.insertMany(seed);
    }
    const accounts =
      process.env.NODE_ENV === "production" || remoteDatabase
        ? [["Store Admin", process.env.ADMIN_EMAIL || "admin@urbancart.test", process.env.ADMIN_PASSWORD, "admin"]]
        : [
            ["Demo Reader", "reader@urbancart.test", "Reader123!", "customer"],
            ["Store Admin", "admin@urbancart.test", "Admin123!", "admin"],
          ];
    for (const [name, email, password, role] of accounts) {
      const existing = await User.findOne({ email });
      if (!existing) {
        await User.create({
          name,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role,
        });
      } else if ((process.env.NODE_ENV === "production" || remoteDatabase) &&
          (!(await bcrypt.compare(password, existing.passwordHash)) || existing.role !== role)) {
        existing.passwordHash = await bcrypt.hash(password, 10);
        existing.role = role;
        await existing.save();
      }
    }
    return new MongoStore();
  }
  return new MemoryStore();
}

function filterBooks(books, query) {
  const q = String(query.q || "")
    .trim()
    .toLowerCase();
  const min =
    query.minPrice === undefined || query.minPrice === ""
      ? 0
      : Number(query.minPrice);
  const max =
    query.maxPrice === undefined || query.maxPrice === ""
      ? Infinity
      : Number(query.maxPrice);
  if (!Number.isFinite(min) || min < 0 || Number.isNaN(max) || max < min)
    throw error("Invalid price range");
  const sort = [
    "featured",
    "price-asc",
    "price-desc",
    "title",
    "newest",
  ].includes(query.sort)
    ? query.sort
    : "featured";
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(query.page, 10) || 1),
  );
  const limit = Math.max(
    1,
    Math.min(24, Number.parseInt(query.limit, 10) || 8),
  );
  let results = books.filter(
    (b) =>
      (!q || `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(q)) &&
      (!query.category || b.category === query.category) &&
      b.price >= min &&
      b.price <= max &&
      (!query.available || query.available === "false" || b.stock > 0),
  );
  if (sort === "price-asc") results.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") results.sort((a, b) => b.price - a.price);
  if (sort === "title") results.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "newest") results.sort((a, b) => (b.year || 0) - (a.year || 0));
  return {
    books: results.slice((page - 1) * limit, page * limit),
    total: results.length,
    page,
    pages: Math.max(1, Math.ceil(results.length / limit)),
  };
}

class MemoryStore {
  constructor() {
    this.users = [];
    this.books = seed.map((b) => ({ ...b }));
    this.categories = [...initialCategories];
    this.carts = new Map();
    this.orders = [];
    for (const [name, email, password, role] of [
      ["Demo Reader", "reader@urbancart.test", "Reader123!", "customer"],
      ["Store Admin", "admin@urbancart.test", "Admin123!", "admin"],
    ])
      this.users.push({
        id: id(),
        name,
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        role,
      });
  }
  async findUserByEmail(email) {
    return this.users.find((u) => u.email === email.toLowerCase()) || null;
  }
  async findUserById(userId) {
    return this.users.find((u) => u.id === userId) || null;
  }
  async createUser(data) {
    if (await this.findUserByEmail(data.email))
      throw error("Email is already registered", 409);
    const u = { id: id(), ...data, role: "customer" };
    this.users.push(u);
    return safeUser(u);
  }
  async categoriesList() {
    return [...this.categories].sort();
  }
  async createCategory(name) {
    if (this.categories.some((c) => c.toLowerCase() === name.toLowerCase()))
      throw error("Category already exists", 409);
    this.categories.push(name);
    return name;
  }
  async updateCategory(oldName, name) {
    if (!this.categories.includes(oldName))
      throw error("Category not found", 404);
    if (oldName !== name && this.categories.includes(name))
      throw error("Category already exists", 409);
    this.categories[this.categories.indexOf(oldName)] = name;
    this.books.forEach((b) => {
      if (b.category === oldName) b.category = name;
    });
    return name;
  }
  async deleteCategory(name) {
    if (this.books.some((b) => b.category === name))
      throw error("Category has books", 409);
    const n = this.categories.indexOf(name);
    if (n < 0) throw error("Category not found", 404);
    this.categories.splice(n, 1);
  }
  async listBooks(q) {
    return filterBooks(this.books.map(bookOut), q);
  }
  async listAllBooks() {
    return this.books.map(bookOut);
  }
  async getBook(bookId) {
    const b = this.books.find((x) => x.id === bookId);
    if (!b) throw error("Book not found", 404);
    return bookOut(b);
  }
  async createBook(data) {
    if (this.books.some((b) => b.isbn === data.isbn))
      throw error("ISBN already exists", 409);
    const b = { id: id(), ...data };
    this.books.unshift(b);
    return bookOut(b);
  }
  async updateBook(bookId, data) {
    const b = this.books.find((x) => x.id === bookId);
    if (!b) throw error("Book not found", 404);
    if (
      data.isbn &&
      this.books.some((x) => x.id !== bookId && x.isbn === data.isbn)
    )
      throw error("ISBN already exists", 409);
    Object.assign(b, data);
    return bookOut(b);
  }
  async deleteBook(bookId) {
    const n = this.books.findIndex((x) => x.id === bookId);
    if (n < 0) throw error("Book not found", 404);
    this.books.splice(n, 1);
    for (const cart of this.carts.values()) cart.delete(bookId);
  }
  async getCart(userId) {
    const entries = [...(this.carts.get(userId) || new Map()).entries()];
    const items = entries
      .map(([bookId, quantity]) => ({
        book: this.books.find((b) => b.id === bookId),
        quantity,
      }))
      .filter((i) => i.book)
      .map((i) => ({
        book: bookOut(i.book),
        quantity: i.quantity,
        subtotal: i.book.price * i.quantity,
      }));
    return { items, total: items.reduce((s, i) => s + i.subtotal, 0) };
  }
  async setCartItem(userId, bookId, quantity) {
    if (!validQuantity(quantity))
      throw error("Quantity must be an integer from 1 to 99");
    const b = await this.getBook(bookId);
    if (b.stock < quantity)
      throw error("Requested quantity exceeds available stock", 409);
    const cart = this.carts.get(userId) || new Map();
    cart.set(bookId, quantity);
    this.carts.set(userId, cart);
    return this.getCart(userId);
  }
  async removeCartItem(userId, bookId) {
    this.carts.get(userId)?.delete(bookId);
    return this.getCart(userId);
  }
  async checkout(userId, address) {
    const cart = this.carts.get(userId);
    if (!cart?.size) throw error("Cart is empty");
    const items = [...cart].map(([bookId, quantity]) => ({
      book: this.books.find((b) => b.id === bookId),
      quantity,
    }));
    for (const i of items)
      if (!i.book || i.book.stock < i.quantity)
        throw error(`Insufficient stock for ${i.book?.title || "a book"}`, 409);
    const subtotal = items.reduce((s, i) => s + i.book.price * i.quantity, 0),
      deliveryFee = subtotal >= 999 ? 0 : 99;
    const order = {
      id: id(),
      user: userId,
      items: items.map((i) => ({
        book: i.book.id,
        title: i.book.title,
        author: i.book.author,
        cover: i.book.cover,
        price: i.book.price,
        quantity: i.quantity,
      })),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      address,
      status: "Placed",
      createdAt: new Date().toISOString(),
    };
    for (const i of items) i.book.stock -= i.quantity;
    this.orders.unshift(order);
    this.carts.delete(userId);
    return orderOut(order);
  }
  async listOrders(userId, admin = false) {
    return this.orders.filter((o) => admin || o.user === userId).map(orderOut);
  }
  async updateOrderStatus(orderId, status) {
    const o = this.orders.find((x) => x.id === orderId);
    if (!o) throw error("Order not found", 404);
    o.status = status;
    return orderOut(o);
  }
}

class MongoStore {
  async findUserByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }
  async findUserById(userId) {
    return mongoose.isValidObjectId(userId) ? User.findById(userId) : null;
  }
  async createUser(data) {
    if (await this.findUserByEmail(data.email))
      throw error("Email is already registered", 409);
    try {
      return safeUser(await User.create(data));
    } catch (e) {
      if (e.code === 11000) throw error("Email is already registered", 409);
      throw e;
    }
  }
  async categoriesList() {
    return (await Category.find().sort("name").lean()).map((c) => c.name);
  }
  async createCategory(name) {
    if (
      await Category.findOne({
        name: new RegExp(
          `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      })
    )
      throw error("Category already exists", 409);
    await Category.create({ name });
    return name;
  }
  async updateCategory(oldName, name) {
    const c = await Category.findOne({ name: oldName });
    if (!c) throw error("Category not found", 404);
    c.name = name;
    await c.save();
    await Book.updateMany({ category: oldName }, { category: name });
    return name;
  }
  async deleteCategory(name) {
    if (await Book.exists({ category: name }))
      throw error("Category has books", 409);
    if (!(await Category.findOneAndDelete({ name })))
      throw error("Category not found", 404);
  }
  async listBooks(q) {
    return filterBooks((await Book.find().lean()).map(bookOut), q);
  }
  async listAllBooks() {
    return (await Book.find().sort({ createdAt: -1 }).lean()).map(bookOut);
  }
  async getBook(bookId) {
    const b = mongoose.isValidObjectId(bookId)
      ? await Book.findById(bookId).lean()
      : null;
    if (!b) throw error("Book not found", 404);
    return bookOut(b);
  }
  async createBook(data) {
    try {
      return bookOut(await Book.create(data));
    } catch (e) {
      if (e.code === 11000) throw error("ISBN already exists", 409);
      throw e;
    }
  }
  async updateBook(bookId, data) {
    const b = mongoose.isValidObjectId(bookId)
      ? await Book.findByIdAndUpdate(bookId, data, {
          new: true,
          runValidators: true,
        })
      : null;
    if (!b) throw error("Book not found", 404);
    return bookOut(b);
  }
  async deleteBook(bookId) {
    const b = mongoose.isValidObjectId(bookId)
      ? await Book.findByIdAndDelete(bookId)
      : null;
    if (!b) throw error("Book not found", 404);
    await Cart.updateMany({}, { $pull: { items: { book: b._id } } });
  }
  async getCart(userId) {
    const cart = await Cart.findOne({ user: userId })
      .populate("items.book")
      .lean();
    const items = (cart?.items || [])
      .filter((i) => i.book)
      .map((i) => ({
        book: bookOut(i.book),
        quantity: i.quantity,
        subtotal: i.book.price * i.quantity,
      }));
    return { items, total: items.reduce((s, i) => s + i.subtotal, 0) };
  }
  async setCartItem(userId, bookId, quantity) {
    if (!validQuantity(quantity))
      throw error("Quantity must be an integer from 1 to 99");
    const b = await this.getBook(bookId);
    if (b.stock < quantity)
      throw error("Requested quantity exceeds available stock", 409);
    const cart =
      (await Cart.findOne({ user: userId })) ||
      new Cart({ user: userId, items: [] });
    const item = cart.items.find((i) => String(i.book) === bookId);
    if (item) item.quantity = quantity;
    else cart.items.push({ book: bookId, quantity });
    await cart.save();
    return this.getCart(userId);
  }
  async removeCartItem(userId, bookId) {
    await Cart.updateOne(
      { user: userId },
      { $pull: { items: { book: bookId } } },
    );
    return this.getCart(userId);
  }
  async checkout(userId, address) {
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const cart = await Cart.findOne({ user: userId }).session(session);
        if (!cart?.items.length) throw error("Cart is empty");
        const items = [];
        for (const entry of cart.items) {
          const b = await Book.findOneAndUpdate(
            { _id: entry.book, stock: { $gte: entry.quantity } },
            { $inc: { stock: -entry.quantity } },
            { new: true, session },
          );
          if (!b)
            throw error("Insufficient stock for a book in your cart", 409);
          items.push({
            book: b._id,
            title: b.title,
            author: b.author,
            cover: b.cover,
            price: b.price,
            quantity: entry.quantity,
          });
        }
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0),
          deliveryFee = subtotal >= 999 ? 0 : 99;
        const [order] = await Order.create(
          [
            {
              user: userId,
              items,
              subtotal,
              deliveryFee,
              total: subtotal + deliveryFee,
              address,
              status: "Placed",
            },
          ],
          { session },
        );
        await Cart.deleteOne({ user: userId }).session(session);
        result = orderOut(order);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
  async listOrders(userId, admin = false) {
    return (
      await Order.find(admin ? {} : { user: userId })
        .sort({ createdAt: -1 })
        .lean()
    ).map(orderOut);
  }
  async updateOrderStatus(orderId, status) {
    const o = mongoose.isValidObjectId(orderId)
      ? await Order.findByIdAndUpdate(
          orderId,
          { status },
          { new: true, runValidators: true },
        )
      : null;
    if (!o) throw error("Order not found", 404);
    return orderOut(o);
  }
}

export { safeUser, error };
