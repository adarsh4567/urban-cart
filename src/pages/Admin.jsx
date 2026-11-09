import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { api, money, useAuth, Notice } from "../shared.jsx";

export function Admin() {
  const { session } = useAuth(),
    [tab, setTab] = useState("overview"),
    [books, setBooks] = useState([]),
    [orders, setOrders] = useState([]),
    [categories, setCategories] = useState([]),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [editing, setEditing] = useState(null),
    [categoryName, setCategoryName] = useState("");
  const empty = {
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    year: 2024,
    category: "Classics",
    price: 399,
    stock: 10,
    cover: "",
    description: "",
  };
  const [form, setForm] = useState(empty);
  async function load() {
    try {
      const [b, o, c] = await Promise.all([
        api("/admin/books"),
        api("/admin/orders"),
        api("/categories"),
      ]);
      setBooks(b.books);
      setOrders(o.orders);
      setCategories(c.categories);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (session?.user.role === "admin") load();
  }, [session]);
  const flash = (m) => {
    setSuccess(m);
    setTimeout(() => setSuccess(""), 3000);
  };
  async function saveBook(e) {
    e.preventDefault();
    setError("");
    try {
      await api(editing ? `/admin/books/${editing}` : "/admin/books", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setEditing(null);
      setForm(empty);
      await load();
      flash("Book saved successfully");
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeBook(id) {
    if (!window.confirm("Delete this book?")) return;
    try {
      await api(`/admin/books/${id}`, { method: "DELETE" });
      await load();
      flash("Book deleted");
    } catch (e) {
      setError(e.message);
    }
  }
  async function addCategory(e) {
    e.preventDefault();
    try {
      await api("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: categoryName }),
      });
      setCategoryName("");
      await load();
      flash("Category added");
    } catch (e) {
      setError(e.message);
    }
  }
  async function deleteCategory(name) {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await api(`/admin/categories/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      await load();
      flash("Category deleted");
    } catch (e) {
      setError(e.message);
    }
  }
  async function changeStatus(id, status) {
    try {
      await api(`/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
      flash("Order updated");
    } catch (e) {
      setError(e.message);
    }
  }
  if (session?.user.role !== "admin")
    return (
      <div className="container empty-state page-pad">
        <LayoutDashboard size={44} />
        <h1>Admin access only</h1>
        <p>This area is for store administrators.</p>
        <Link className="button primary" to="/">
          Return home
        </Link>
      </div>
    );
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-label">STORE MANAGEMENT</div>
        {[
          ["overview", "Overview"],
          ["books", "Books"],
          ["categories", "Categories"],
          ["orders", "Orders"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => {
              setTab(key);
              setEditing(null);
            }}
          >
            {label}
          </button>
        ))}
      </aside>
      <div className="admin-content">
        <div className="admin-top">
          <div>
            <span className="eyebrow accent">URBANCART ADMIN</span>
            <h1>{tab[0].toUpperCase() + tab.slice(1)}</h1>
          </div>
          <span>Store dashboard</span>
        </div>
        <Notice message={error} />
        <Notice message={success} type="success" />
        {tab === "overview" && (
          <>
            <div className="stat-grid">
              <div>
                <span>Total books</span>
                <strong>{books.length}</strong>
                <BookOpen />
              </div>
              <div>
                <span>Categories</span>
                <strong>{categories.length}</strong>
                <SlidersHorizontal />
              </div>
              <div>
                <span>Orders placed</span>
                <strong>{orders.length}</strong>
                <Package />
              </div>
              <div>
                <span>Revenue (demo)</span>
                <strong>
                  {money(orders.reduce((s, o) => s + o.total, 0))}
                </strong>
                <ShoppingBag />
              </div>
            </div>
            <div className="admin-panel">
              <h2>Recent orders</h2>
              {orders.length ? (
                orders.slice(0, 5).map((o) => (
                  <div className="admin-order-row" key={o.id}>
                    <span>#{o.id.slice(-8)}</span>
                    <span>{o.items.length} books</span>
                    <strong>{money(o.total)}</strong>
                    <span className="status-pill">{o.status}</span>
                  </div>
                ))
              ) : (
                <p>No orders yet. Place a demo order to see it here.</p>
              )}
            </div>
          </>
        )}
        {tab === "books" && (
          <>
            <div className="admin-actions">
              <p>Manage your store's catalogue, prices, and stock.</p>
              <button
                className="button primary"
                onClick={() => {
                  setEditing("new");
                  setForm(empty);
                }}
              >
                <Plus size={18} /> Add book
              </button>
            </div>
            {editing && (
              <form className="admin-panel book-form" onSubmit={saveBook}>
                <div className="form-heading">
                  <h2>{editing === "new" ? "Add a book" : "Edit book"}</h2>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setEditing(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="form-grid">
                  {[
                    ["title", "Title"],
                    ["author", "Author"],
                    ["isbn", "ISBN"],
                    ["publisher", "Publisher"],
                    ["year", "Year"],
                    ["category", "Category"],
                    ["price", "Price (₹)"],
                    ["stock", "Stock quantity"],
                    ["cover", "Cover image URL"],
                    ["description", "Description"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className={
                        key === "description" || key === "cover" ? "span-2" : ""
                      }
                    >
                      {label}
                      {key === "category" ? (
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      ) : key === "description" ? (
                        <textarea
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                        />
                      ) : (
                        <input
                          required={!["publisher", "cover"].includes(key)}
                          type={
                            ["year", "price", "stock"].includes(key)
                              ? "number"
                              : "text"
                          }
                          min={
                            ["year", "price", "stock"].includes(key)
                              ? "0"
                              : undefined
                          }
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
                <button className="button primary" type="submit">
                  Save book
                </button>
              </form>
            )}
            <div className="admin-panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="table-book">
                          <img src={b.cover} alt="" />
                          <span>
                            <strong>{b.title}</strong>
                            <small>{b.author}</small>
                          </span>
                        </div>
                      </td>
                      <td>{b.category}</td>
                      <td>{money(b.price)}</td>
                      <td>
                        <span className={b.stock < 5 ? "low-stock" : ""}>
                          {b.stock}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action"
                          onClick={() => {
                            setEditing(b.id);
                            setForm({ ...b });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="table-action danger"
                          onClick={() => removeBook(b.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "categories" && (
          <div className="admin-panel category-admin">
            <h2>Categories</h2>
            <form onSubmit={addCategory}>
              <input
                required
                placeholder="New category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <button className="button primary">
                <Plus size={17} /> Add category
              </button>
            </form>
            {categories.map((c) => (
              <div className="category-row" key={c}>
                <span>{c}</span>
                <div>
                  <button
                    onClick={async () => {
                      const name = window.prompt("New category name", c);
                      if (!name || name === c) return;
                      try {
                        await api(
                          `/admin/categories/${encodeURIComponent(c)}`,
                          { method: "PATCH", body: JSON.stringify({ name }) },
                        );
                        await load();
                        flash("Category renamed");
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Rename
                  </button>
                  <button onClick={() => deleteCategory(c)}>Delete</button>
                </div>
              </div>
            ))}
            <p className="muted">
              Categories containing books cannot be deleted.
            </p>
          </div>
        )}
        {tab === "orders" && (
          <div className="admin-panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>#{o.id.slice(-8)}</strong>
                      <small>
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </small>
                    </td>
                    <td>
                      {o.items
                        .map((i) => `${i.title} ×${i.quantity}`)
                        .join(", ")}
                    </td>
                    <td>{money(o.total)}</td>
                    <td>
                      {o.address.city}, {o.address.state}
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                      >
                        {[
                          "Placed",
                          "Packed",
                          "Shipped",
                          "Delivered",
                          "Cancelled",
                        ].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && <p>No orders yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
