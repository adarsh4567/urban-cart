import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createStore } from "../store.js";
import { createApp } from "../app.js";

const uri = process.env.MONGODB_TEST_URI;
test(
  "MongoDB transaction preserves stock, orders and cart under contention",
  { skip: !uri },
  async () => {
    const store = await createStore(uri),
      server = createApp(store).listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function req(path, token, method = "GET", body) {
      const r = await fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return {
        status: r.status,
        data: r.status === 204 ? null : await r.json(),
      };
    }
    try {
      const suffix = Date.now().toString(),
        address = {
          fullName: "Test Buyer",
          line1: "1 Test Road",
          city: "Kolkata",
          state: "West Bengal",
          postalCode: "700001",
          phone: "9876543210",
        };
      const admin = (
        await req("/auth/login", null, "POST", {
          email: "admin@urbancart.test",
          password: "Admin123!",
        })
      ).data.token;
      const users = await Promise.all(
        [1, 2].map(
          async (i) =>
            (
              await req("/auth/register", null, "POST", {
                name: `Mongo Test ${i}`,
                email: `mongo-${suffix}-${i}@example.test`,
                password: "Password123!",
              })
            ).data.token,
        ),
      );
      const created = await req("/admin/books", admin, "POST", {
        title: `Scarce Book ${suffix}`,
        author: "Test Author",
        isbn: `978${suffix.slice(-10)}`,
        category: "Classics",
        price: 450,
        stock: 1,
        year: 2024,
      });
      assert.equal(created.status, 201);
      const scarce = created.data.book.id;
      await Promise.all(
        users.map((token) =>
          req(`/cart/${scarce}`, token, "PUT", { quantity: 1 }),
        ),
      );
      const results = await Promise.all(
        users.map((token) => req("/checkout", token, "POST", { address })),
      );
      assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
      assert.equal((await req(`/books/${scarce}`)).data.book.stock, 0);
      const successful = results.findIndex((x) => x.status === 201),
        failed = 1 - successful;
      assert.equal((await req("/cart", users[failed])).data.items.length, 1);
      const healthy = (
        await req("/admin/books", admin, "POST", {
          title: `Healthy Book ${suffix}`,
          author: "Test Author",
          isbn: `979${suffix.slice(-10)}`,
          category: "Classics",
          price: 300,
          stock: 1,
          year: 2024,
        })
      ).data.book.id;
      await req(`/cart/${healthy}`, users[failed], "PUT", { quantity: 1 });
      const rollback = await req("/checkout", users[failed], "POST", {
        address,
      });
      assert.equal(rollback.status, 409);
      assert.equal((await req(`/books/${healthy}`)).data.book.stock, 1);
      assert.equal((await req("/cart", users[failed])).data.items.length, 2);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
    }
  },
);
