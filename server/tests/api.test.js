import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../store.js";
import { createApp } from "../app.js";

let server, base;
before(async () => {
  const store = await createStore();
  server = createApp(store).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => new Promise((resolve) => server.close(resolve)));
async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
  };
}
const address = {
  fullName: "Test Reader",
  line1: "123 Demo Street",
  city: "Kolkata",
  state: "West Bengal",
  postalCode: "700001",
  phone: "9876543210",
};
async function login(email, password) {
  const r = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(r.status, 200);
  return r.data.token;
}

test("catalogue search, category, price, sorting, pagination and book details", async () => {
  const list = await request("/books?limit=3&sort=price-asc");
  assert.equal(list.status, 200);
  assert.equal(list.data.books.length, 3);
  assert.ok(list.data.books[0].price <= list.data.books[1].price);
  const book = list.data.books[0];
  const detail = await request(`/books/${book.id}`);
  assert.equal(detail.data.book.title, book.title);
  const search = await request(`/books?q=${encodeURIComponent(book.isbn)}`);
  assert.ok(search.data.books.some((b) => b.id === book.id));
  const category = await request(
    `/books?category=${encodeURIComponent(book.category)}`,
  );
  assert.ok(category.data.books.every((b) => b.category === book.category));
  const price = await request(`/books?maxPrice=${book.price}`);
  assert.ok(price.data.books.every((b) => b.price <= book.price));
  assert.equal((await request("/books?minPrice=1000&maxPrice=1")).status, 400);
});
test("registration, authentication, cart, server totals and order history", async () => {
  const email = `reader-${Date.now()}@example.test`;
  const registered = await request("/auth/register", {
    method: "POST",
    body: { name: "Test Reader", email, password: "LongPassword1!" },
  });
  assert.equal(registered.status, 201);
  const token = registered.data.token;
  assert.equal(
    (
      await request("/auth/register", {
        method: "POST",
        body: { name: "Test Reader", email, password: "LongPassword1!" },
      })
    ).status,
    409,
  );
  assert.equal((await request("/orders")).status, 401);
  const {
    data: {
      books: [book],
    },
  } = await request("/books?limit=1");
  assert.equal(
    (
      await request(`/cart/${book.id}`, {
        method: "PUT",
        token,
        body: { quantity: 100 },
      })
    ).status,
    400,
  );
  const cart = await request(`/cart/${book.id}`, {
    method: "PUT",
    token,
    body: { quantity: 1 },
  });
  assert.equal(cart.data.total, book.price);
  const checkout = await request("/checkout", {
    method: "POST",
    token,
    body: { address },
  });
  assert.equal(checkout.status, 201);
  assert.equal(checkout.data.order.subtotal, book.price);
  assert.equal(checkout.data.order.deliveryFee, book.price >= 999 ? 0 : 99);
  assert.equal(
    checkout.data.order.total,
    book.price + (book.price >= 999 ? 0 : 99),
  );
  assert.equal((await request("/cart", { token })).data.items.length, 0);
  assert.equal((await request("/orders", { token })).data.orders.length, 1);
  assert.equal(
    (await request("/checkout", { method: "POST", token, body: { address } }))
      .status,
    400,
  );
});
test("admin authorization and catalogue/order management", async () => {
  const customer = await login("reader@urbancart.test", "Reader123!"),
    admin = await login("admin@urbancart.test", "Admin123!");
  assert.equal(
    (await request("/admin/orders", { token: customer })).status,
    403,
  );
  assert.equal(
    (await request("/admin/books", { token: customer })).status,
    403,
  );
  const created = await request("/admin/categories", {
    method: "POST",
    token: admin,
    body: { name: "Demo Shelf" },
  });
  assert.equal(created.status, 201);
  const book = await request("/admin/books", {
    method: "POST",
    token: admin,
    body: {
      title: "Demo Book",
      author: "Demo Author",
      isbn: "9781234567897",
      category: "Demo Shelf",
      price: 299,
      stock: 2,
      year: 2024,
      publisher: "Demo Press",
      description: "Test book",
    },
  });
  assert.equal(book.status, 201);
  const id = book.data.book.id;
  assert.ok(
    (await request("/admin/books", { token: admin })).data.books.some(
      (b) => b.id === id,
    ),
  );
  assert.equal(
    (
      await request("/admin/categories/Demo%20Shelf", {
        method: "DELETE",
        token: admin,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/admin/books/${id}`, {
        method: "PATCH",
        token: admin,
        body: { price: 349, stock: 1 },
      })
    ).data.book.price,
    349,
  );
  assert.equal(
    (await request(`/admin/books/${id}`, { method: "DELETE", token: admin }))
      .status,
    204,
  );
  assert.equal(
    (
      await request("/admin/categories/Demo%20Shelf", {
        method: "DELETE",
        token: admin,
      })
    ).status,
    204,
  );
  const orders = await request("/admin/orders", { token: admin });
  assert.ok(orders.data.orders.length > 0);
  const orderId = orders.data.orders[0].id;
  assert.equal(
    (
      await request(`/admin/orders/${orderId}`, {
        method: "PATCH",
        token: admin,
        body: { status: "Packed" },
      })
    ).data.order.status,
    "Packed",
  );
  assert.equal(
    (
      await request(`/admin/orders/${orderId}`, {
        method: "PATCH",
        token: admin,
        body: { status: "Invalid" },
      })
    ).status,
    400,
  );
});
test("simultaneous checkout cannot oversell one remaining copy", async () => {
  const admin = await login("admin@urbancart.test", "Admin123!");
  const created = await request("/admin/books", {
    method: "POST",
    token: admin,
    body: {
      title: "Limited Copy",
      author: "Test",
      isbn: "9781234567898",
      category: "Classics",
      price: 400,
      stock: 1,
      year: 2024,
    },
  });
  const bookId = created.data.book.id;
  const users = await Promise.all(
    [1, 2].map(async (i) => {
      const r = await request("/auth/register", {
        method: "POST",
        body: {
          name: `Buyer ${i}`,
          email: `buyer-${Date.now()}-${i}@example.test`,
          password: "Password123!",
        },
      });
      return r.data.token;
    }),
  );
  await Promise.all(
    users.map((token) =>
      request(`/cart/${bookId}`, {
        method: "PUT",
        token,
        body: { quantity: 1 },
      }),
    ),
  );
  const results = await Promise.all(
    users.map((token) =>
      request("/checkout", { method: "POST", token, body: { address } }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await request(`/books/${bookId}`)).data.book.stock, 0);
  const orders = await request("/admin/orders", { token: admin });
  const limitedOrders = orders.data.orders.filter((o) =>
    o.items.some((i) => i.book === bookId),
  );
  assert.equal(limitedOrders.length, 1);
});
