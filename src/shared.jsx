import React, { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const AuthContext = createContext(null);
export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const authKey = "urbancart-session";
export async function api(path, options = {}) {
  const session = JSON.parse(localStorage.getItem(authKey) || "null");
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && session?.token) {
    localStorage.removeItem(authKey);
    window.dispatchEvent(new Event("urbancart:session-expired"));
  }
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem(authKey) || "null"),
  );
  const [cartCount, setCartCount] = useState(0);
  function save(value) {
    if (value) localStorage.setItem(authKey, JSON.stringify(value));
    else localStorage.removeItem(authKey);
    setSession(value);
  }
  useEffect(() => {
    const expired = () => setSession(null);
    window.addEventListener("urbancart:session-expired", expired);
    return () =>
      window.removeEventListener("urbancart:session-expired", expired);
  }, []);
  async function refreshCart() {
    if (!localStorage.getItem(authKey)) return setCartCount(0);
    try {
      const c = await api("/cart");
      setCartCount(c.items.reduce((s, i) => s + i.quantity, 0));
    } catch {
      setCartCount(0);
    }
  }
  useEffect(() => {
    refreshCart();
  }, [session?.token]);
  return (
    <AuthContext.Provider value={{ session, save, cartCount, refreshCart }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function Header() {
  const { session, save, cartCount } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const logout = () => {
    save(null);
    setOpen(false);
    nav("/");
  };
  return (
    <>
      <div className="announcement">
        A little story for every day <span>✦</span> Free delivery on orders over
        ₹999
      </div>
      <header className="header">
        <div className="container header-inner">
          <Link className="brand" to="/">
            <BookOpen size={27} strokeWidth={2.1} />
            <span>
              Urban<span>Cart</span>
            </span>
          </Link>
          <nav className={open ? "nav open" : "nav"}>
            <NavLink to="/" end onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/books" onClick={() => setOpen(false)}>
              Explore books
            </NavLink>
            <NavLink
              to="/books?category=Classics"
              onClick={() => setOpen(false)}
            >
              Classics
            </NavLink>
            <NavLink
              to="/books?category=Fantasy"
              onClick={() => setOpen(false)}
            >
              Fantasy
            </NavLink>
          </nav>
          <div className="header-actions">
            <button
              className="icon-btn search-head"
              aria-label="Search books"
              onClick={() => nav("/books")}
            >
              <Search size={21} />
            </button>
            {session ? (
              <div className="account-menu">
                <button
                  className="account-trigger"
                  onClick={() =>
                    setOpen(open === "account" ? false : "account")
                  }
                >
                  <UserRound size={20} />
                  <span>{session.user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {open === "account" && (
                  <div className="account-pop">
                    <Link to="/orders" onClick={() => setOpen(false)}>
                      My orders
                    </Link>
                    {session.user.role === "admin" && (
                      <Link to="/admin" onClick={() => setOpen(false)}>
                        Admin dashboard
                      </Link>
                    )}
                    <button onClick={logout}>Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="sign-in" to="/login">
                Sign in
              </Link>
            )}
            <Link className="cart-header" to="/cart" aria-label="Shopping cart">
              <ShoppingBag size={21} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>
            <button
              className="icon-btn mobile-menu"
              aria-label="Menu"
              onClick={() => setOpen(!open)}
            >
              <Menu size={23} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" to="/">
            <BookOpen size={26} />
            <span>
              Urban<span>Cart</span>
            </span>
          </Link>
          <p>
            A little corner of the internet for people who love books and the
            places they take us.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/books">All books</Link>
          <Link to="/books?category=Classics">Classics</Link>
          <Link to="/books?category=Fantasy">Fantasy</Link>
        </div>
        <div>
          <h4>Your account</h4>
          <Link to="/login">Sign in</Link>
          <Link to="/orders">Your orders</Link>
          <Link to="/cart">Shopping bag</Link>
        </div>
        <div>
          <h4>Good to know</h4>
          <p>
            Demo bookstore for an academic project. Payments and delivery are
            simulated.
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} UrbanCart. Made for curious minds.
        </span>
        <span>Book metadata and covers from Open Library</span>
      </div>
    </footer>
  );
}
export function Layout({ children }) {
  return (
    <>
      <ScrollTop />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
export function Loading() {
  return <div className="loading">Turning the page…</div>;
}
export function Notice({ message, type = "error" }) {
  return message ? (
    <div className={`notice ${type}`} role="alert">
      {message}
    </div>
  ) : null;
}
export function BookCard({ book }) {
  return (
    <Link className="book-card" to={`/books/${book.id}`}>
      <div className="book-cover">
        <img
          src={book.cover}
          alt={`${book.title} cover`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {book.stock === 0 && <span className="sold-out">Out of stock</span>}
      </div>
      <div className="book-meta">
        <span className="eyebrow">{book.category}</span>
        <h3>{book.title}</h3>
        <p>{book.author}</p>
        <div className="book-bottom">
          <strong>{money(book.price)}</strong>
          <span className="round-arrow">
            <ArrowRight size={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}
