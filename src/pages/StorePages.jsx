import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import { api, money, useAuth, Loading, Notice, BookCard } from "../shared.jsx";

export function Home() {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    api("/books?limit=8")
      .then((d) => setBooks(d.books))
      .catch(() => {});
  }, []);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span>✦</span> YOUR NEXT GREAT READ AWAITS
            </div>
            <h1>
              Between the covers,
              <br />
              <em>anything</em> is possible.
            </h1>
            <p>
              Find the stories that stay with you. Browse old favourites,
              discover new voices, and give your bookshelf something to look
              forward to.
            </p>
            <div className="hero-buttons">
              <Link to="/books" className="button primary">
                Explore the collection <ArrowRight size={18} />
              </Link>
              <Link to="/books?category=Classics" className="text-link">
                Browse classics <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-foot">
              <div className="mini-stars">★★★★★</div>
              <span>Good stories. Great prices. All yours.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-blob" />
            <div className="hero-book book-one">
              <img
                src="https://covers.openlibrary.org/b/id/12356249-L.jpg"
                alt="Frankenstein cover"
              />
            </div>
            <div className="hero-book book-two">
              <img
                src="https://covers.openlibrary.org/b/id/13617691-L.jpg"
                alt="A Wizard of Earthsea cover"
              />
            </div>
            <div className="hero-book book-three">
              <img
                src="https://covers.openlibrary.org/b/id/14314858-L.jpg"
                alt="The Picture of Dorian Gray cover"
              />
            </div>
            <div className="floating-note">
              <Sparkles size={19} />
              <span>Stories worth sharing</span>
            </div>
          </div>
        </div>
      </section>
      <section className="benefits">
        <div className="container benefit-grid">
          <div>
            <BookOpen />
            <span>
              <strong>Curated for readers</strong>
              <small>Find a book you’ll love</small>
            </span>
          </div>
          <div>
            <Truck />
            <span>
              <strong>Easy, breezy checkout</strong>
              <small>From shelf to doorstep</small>
            </span>
          </div>
          <div>
            <Heart />
            <span>
              <strong>Stories for everyone</strong>
              <small>Discover your next favourite</small>
            </span>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow accent">HANDPICKED FOR YOU</span>
            <h2>Books to get lost in</h2>
            <p>Fresh picks for your next reading adventure.</p>
          </div>
          <Link to="/books" className="text-link">
            See all books <ArrowRight size={18} />
          </Link>
        </div>
        <div className="book-grid">
          {books.slice(0, 4).map((b) => (
            <BookCard book={b} key={b.id} />
          ))}
        </div>
      </section>
      <section className="category-band">
        <div className="container category-content">
          <div>
            <span className="eyebrow">FIND YOUR KIND OF STORY</span>
            <h2>
              What are you in the
              <br />
              <em>mood to read?</em>
            </h2>
          </div>
          <div className="category-tiles">
            {["Classics", "Fantasy", "Mystery", "Romance"].map((c, i) => (
              <Link
                key={c}
                to={`/books?category=${encodeURIComponent(c)}`}
                className={`category-tile tile-${i}`}
              >
                <span>{["✦", "☾", "◈", "♡"][i]}</span>
                <strong>{c}</strong>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="newsletter">
        <div className="container">
          <div>
            <span className="eyebrow accent">A READER'S PARADISE</span>
            <h2>
              Every great story starts
              <br />
              with a first page.
            </h2>
            <p>There’s a whole world waiting on our shelves.</p>
            <Link className="button primary" to="/books">
              Start exploring <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
export function Catalog() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null),
    [categories, setCategories] = useState([]),
    [error, setError] = useState(""),
    [search, setSearch] = useState(params.get("q") || "");
  useEffect(() => {
    setSearch(params.get("q") || "");
    setData(null);
    api(`/books?${params.toString()}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.toString()]);
  useEffect(() => {
    api("/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  return (
    <div className="container catalog-page">
      <div className="page-intro">
        <span className="eyebrow accent">THE URBANCART COLLECTION</span>
        <h1>
          Find your next <em>favourite.</em>
        </h1>
        <p>A good book is always worth finding. Take your time and explore.</p>
      </div>
      <div className="catalog-shell">
        <aside className="filters">
          <div className="filter-title">
            <SlidersHorizontal size={18} />
            <strong>Filters</strong>
            <button onClick={() => setParams({})}>Clear all</button>
          </div>
          <div className="filter-section">
            <h4>Category</h4>
            <button
              className={!params.get("category") ? "filter-active" : ""}
              onClick={() => update("category", "")}
            >
              All books
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={params.get("category") === c ? "filter-active" : ""}
                onClick={() => update("category", c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="filter-section">
            <h4>Price range</h4>
            <div className="price-inputs">
              <input
                aria-label="Minimum price"
                type="number"
                min="0"
                placeholder="Min ₹"
                value={params.get("minPrice") || ""}
                onChange={(e) => update("minPrice", e.target.value)}
              />
              <span>—</span>
              <input
                aria-label="Maximum price"
                type="number"
                min="0"
                placeholder="Max ₹"
                value={params.get("maxPrice") || ""}
                onChange={(e) => update("maxPrice", e.target.value)}
              />
            </div>
          </div>
          <label className="stock-check">
            <input
              type="checkbox"
              checked={params.get("available") === "true"}
              onChange={(e) =>
                update("available", e.target.checked ? "true" : "")
              }
            />{" "}
            In stock only
          </label>
        </aside>
        <div className="catalog-main">
          <div className="toolbar">
            <form
              className="search-box"
              onSubmit={(e) => {
                e.preventDefault();
                update("q", search);
              }}
            >
              <Search size={19} />
              <input
                placeholder="Search title, author or ISBN"
                aria-label="Search books"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button aria-label="Submit search" type="submit">
                <ArrowRight size={18} />
              </button>
            </form>
            <select
              aria-label="Sort books"
              value={params.get("sort") || "featured"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="title">Title: A to Z</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
          <Notice message={error} />
          {data ? (
            <>
              <p className="results-count">
                Showing {data.books.length} of {data.total} books
              </p>
              {data.books.length ? (
                <div className="book-grid catalog-grid">
                  {data.books.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <BookOpen size={40} />
                  <h3>No books found</h3>
                  <p>Try a different search or adjust your filters.</p>
                  <button
                    className="button primary"
                    onClick={() => setParams({})}
                  >
                    Show all books
                  </button>
                </div>
              )}
              <div className="pagination">
                <button
                  disabled={data.page <= 1}
                  onClick={() => update("page", String(data.page - 1))}
                >
                  ← Previous
                </button>
                <span>
                  Page {data.page} of {data.pages}
                </span>
                <button
                  disabled={data.page >= data.pages}
                  onClick={() => update("page", String(data.page + 1))}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </div>
  );
}
export function Detail() {
  const { id } = useParams(),
    nav = useNavigate(),
    { session, refreshCart } = useAuth();
  const [book, setBook] = useState(null),
    [qty, setQty] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [added, setAdded] = useState(false);
  useEffect(() => {
    api(`/books/${id}`)
      .then((d) => setBook(d.book))
      .catch((e) => setError(e.message));
  }, [id]);
  async function add() {
    if (!session) return nav("/login", { state: { from: `/books/${id}` } });
    setBusy(true);
    setError("");
    try {
      const cart = await api("/cart");
      const current = cart.items.find((i) => i.book.id === id)?.quantity || 0;
      await api(`/cart/${id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: current + qty }),
      });
      await refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (error && !book)
    return (
      <div className="container page-pad">
        <Notice message={error} />
      </div>
    );
  if (!book) return <Loading />;
  return (
    <div className="container detail-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/books">Books</Link>
        <span>/</span>
        <span>{book.title}</span>
      </div>
      <div className="detail-grid">
        <div className="detail-image">
          <img src={book.cover} alt={`${book.title} cover`} />
        </div>
        <div className="detail-info">
          <span className="eyebrow accent">{book.category}</span>
          <h1>{book.title}</h1>
          <p className="detail-author">
            by <strong>{book.author}</strong>
          </p>
          <div className="detail-rule" />
          <div className="detail-price">{money(book.price)}</div>
          <p className={book.stock ? "stock in" : "stock out"}>
            <span />{" "}
            {book.stock
              ? `${book.stock} copies in stock`
              : "Currently out of stock"}
          </p>
          <p className="detail-description">{book.description}</p>
          <div className="detail-actions">
            <div className="qty-control">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus size={17} />
              </button>
              <span>{qty}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty(Math.min(book.stock, qty + 1))}
              >
                <Plus size={17} />
              </button>
            </div>
            <button
              className="button primary"
              disabled={!book.stock || busy}
              onClick={add}
            >
              {added ? (
                <>
                  <Check size={19} /> Added to bag
                </>
              ) : (
                <>
                  <ShoppingBag size={19} /> Add to bag
                </>
              )}
            </button>
          </div>
          <Notice message={error} />
          <div className="detail-facts">
            <div>
              <span>Publisher</span>
              <strong>{book.publisher || "—"}</strong>
            </div>
            <div>
              <span>First published</span>
              <strong>{book.year || "—"}</strong>
            </div>
            <div>
              <span>ISBN</span>
              <strong>{book.isbn}</strong>
            </div>
            <div>
              <span>Format</span>
              <strong>Physical book</strong>
            </div>
          </div>
          <p className="detail-note">
            <Truck size={18} /> Simulated delivery for this academic demo
          </p>
        </div>
      </div>
    </div>
  );
}
export function AuthPage({ mode }) {
  const nav = useNavigate(),
    location = useLocation(),
    { save } = useAuth(),
    [form, setForm] = useState({ name: "", email: "", password: "" }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const register = mode === "register";
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      save(data);
      nav(location.state?.from || "/books");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-aside">
        <BookOpen size={42} />
        <h2>
          Stories are better
          <br />
          when shared.
        </h2>
        <p>
          Find your next favourite and let the pages take you somewhere new.
        </p>
        <div className="auth-book">
          “There is no friend as loyal as a book.”
          <br />
          <span>— Ernest Hemingway</span>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow accent">WELCOME TO URBANCART</span>
          <h1>{register ? "Create your account" : "Welcome back"}</h1>
          <p>
            {register
              ? "Join our community of readers."
              : "Sign in to continue your reading journey."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  autoComplete="name"
                  required
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 8 : 1}
                placeholder="Enter your password"
              />
            </label>
            <Notice message={error} />
            <button className="button primary full" disabled={busy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}{" "}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to UrbanCart?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
            {import.meta.env.DEV && (
              <div className="demo-hint">
                <strong>Try the local demo</strong>
                <span>Reader: reader@urbancart.test / Reader123!</span>
                <span>Admin: admin@urbancart.test / Admin123!</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
export function Cart() {
  const { session, refreshCart } = useAuth(),
    nav = useNavigate(),
    [cart, setCart] = useState(null),
    [error, setError] = useState("");
  async function load() {
    try {
      setCart(await api("/cart"));
      await refreshCart();
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (session) load();
  }, [session]);
  async function change(id, quantity) {
    try {
      setError("");
      setCart(
        await api(
          `/cart/${id}`,
          quantity < 1
            ? { method: "DELETE" }
            : { method: "PUT", body: JSON.stringify({ quantity }) },
        ),
      );
      await refreshCart();
    } catch (e) {
      setError(e.message);
    }
  }
  if (!session)
    return (
      <div className="container empty-state page-pad">
        <ShoppingBag size={44} />
        <h1>Your bag awaits</h1>
        <p>Sign in to start collecting your next reads.</p>
        <Link className="button primary" to="/login" state={{ from: "/cart" }}>
          Sign in <ArrowRight size={17} />
        </Link>
      </div>
    );
  if (!cart) return <Loading />;
  return (
    <div className="container page-pad">
      <div className="page-intro compact">
        <span className="eyebrow accent">YOUR READING LIST</span>
        <h1>
          Your shopping <em>bag.</em>
        </h1>
        <p>
          {cart.items.length} {cart.items.length === 1 ? "book" : "books"}{" "}
          waiting for you
        </p>
      </div>
      <Notice message={error} />
      {cart.items.length ? (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map(({ book, quantity, subtotal }) => (
              <div className="cart-item" key={book.id}>
                <Link to={`/books/${book.id}`}>
                  <img src={book.cover} alt={`${book.title} cover`} />
                </Link>
                <div className="cart-item-details">
                  <span className="eyebrow">{book.category}</span>
                  <Link to={`/books/${book.id}`}>
                    <h3>{book.title}</h3>
                  </Link>
                  <p>{book.author}</p>
                  <strong>{money(book.price)}</strong>
                  <div className="cart-controls">
                    <div className="qty-control small">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => change(book.id, quantity - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => change(book.id, quantity + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => change(book.id, 0)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
                <strong className="item-subtotal">{money(subtotal)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-card">
            <h3>Order summary</h3>
            <div>
              <span>Subtotal</span>
              <strong>{money(cart.total)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{cart.total >= 999 ? "Free" : money(99)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>
                {money(cart.total + (cart.total >= 999 ? 0 : 99))}
              </strong>
            </div>
            <p>Payment is simulated for this demo.</p>
            <button
              className="button primary full"
              onClick={() => nav("/checkout")}
            >
              Continue to checkout <ArrowRight size={17} />
            </button>
            <Link className="continue-link" to="/books">
              ← Continue shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={44} />
          <h2>Your bag is empty</h2>
          <p>There are so many good stories waiting to be found.</p>
          <Link className="button primary" to="/books">
            Explore books <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}
export function Checkout() {
  const nav = useNavigate(),
    { session, refreshCart } = useAuth(),
    [cart, setCart] = useState(null),
    [form, setForm] = useState({
      fullName: session?.user.name || "",
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (session)
      api("/cart")
        .then(setCart)
        .catch((e) => setError(e.message));
  }, [session]);
  if (!session)
    return (
      <div className="container page-pad">
        <Link to="/login" state={{ from: "/checkout" }}>
          Sign in to continue
        </Link>
      </div>
    );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { order } = await api("/checkout", {
        method: "POST",
        body: JSON.stringify({ address: form }),
      });
      await refreshCart();
      nav(`/orders?placed=${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page-pad">
      <div className="page-intro compact">
        <span className="eyebrow accent">ALMOST THERE</span>
        <h1>
          Checkout<span className="period">.</span>
        </h1>
        <p>Just a few details before your books are on their way.</p>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Delivery details</h2>
          <div className="form-grid">
            <label className="span-2">
              Full name
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="span-2">
              Street address
              <input
                required
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                placeholder="House / flat number and street"
              />
            </label>
            <label>
              City
              <input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label>
              State
              <input
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </label>
            <label>
              Postal code
              <input
                required
                value={form.postalCode}
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
              />
            </label>
            <label>
              Phone number
              <input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
          </div>
          <div className="payment-note">
            <Check size={20} />
            <div>
              <strong>Demo payment</strong>
              <p>
                No card or payment information needed. Your order will be placed
                instantly.
              </p>
            </div>
          </div>
          <Notice message={error} />
          <button
            className="button primary"
            disabled={busy || !cart?.items.length}
          >
            {busy ? "Placing order…" : "Place demo order"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="summary-card">
          <h3>Your order</h3>
          {cart?.items.map((i) => (
            <div className="checkout-line" key={i.book.id}>
              <span>
                {i.book.title} × {i.quantity}
              </span>
              <strong>{money(i.subtotal)}</strong>
            </div>
          ))}
          <div>
            <span>Delivery</span>
            <strong>{cart?.total >= 999 ? "Free" : money(99)}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>
              {money((cart?.total || 0) + ((cart?.total || 0) >= 999 ? 0 : 99))}
            </strong>
          </div>
          <p>All prices are in INR. No real payment is taken.</p>
        </aside>
      </div>
    </div>
  );
}
export function Orders() {
  const { session } = useAuth(),
    [params] = useSearchParams(),
    [orders, setOrders] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (session)
      api("/orders")
        .then((d) => setOrders(d.orders))
        .catch((e) => setError(e.message));
  }, [session]);
  if (!session)
    return (
      <div className="container empty-state page-pad">
        <Package size={44} />
        <h1>Sign in to see your orders</h1>
        <Link
          className="button primary"
          to="/login"
          state={{ from: "/orders" }}
        >
          Sign in
        </Link>
      </div>
    );
  return (
    <div className="container page-pad orders-page">
      <div className="page-intro compact">
        <span className="eyebrow accent">YOUR BOOKSHELF IN MOTION</span>
        <h1>
          My <em>orders.</em>
        </h1>
        <p>All your book journeys, in one place.</p>
      </div>
      {params.get("placed") && (
        <Notice
          type="success"
          message="Your demo order was placed successfully!"
        />
      )}
      <Notice message={error} />
      {orders === null ? (
        <Loading />
      ) : orders.length ? (
        orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-head">
              <div>
                <span className="eyebrow">
                  ORDER #{o.id.slice(-8).toUpperCase()}
                </span>
                <p>
                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="status-pill">{o.status}</span>
            </div>
            <div className="order-books">
              {o.items.map((i, n) => (
                <div key={n}>
                  <img src={i.cover} alt="" />
                  <span>
                    <strong>{i.title}</strong>
                    <small>
                      Qty {i.quantity} · {money(i.price)}
                    </small>
                  </span>
                </div>
              ))}
            </div>
            <div className="order-foot">
              <span>
                Deliver to {o.address.city}, {o.address.state}
              </span>
              <strong>Total {money(o.total)}</strong>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <Package size={44} />
          <h2>No orders yet</h2>
          <p>Your next read is waiting.</p>
          <Link className="button primary" to="/books">
            Explore books
          </Link>
        </div>
      )}
    </div>
  );
}
