import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider, Layout } from "./shared.jsx";
import {
  Home,
  Catalog,
  Detail,
  AuthPage,
  Cart,
  Checkout,
  Orders,
} from "./pages/StorePages.jsx";
import { Admin } from "./pages/Admin.jsx";
import "./styles.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Catalog />} />
            <Route path="/books/:id" element={<Detail />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin" element={<Admin />} />
            <Route
              path="*"
              element={
                <div className="container empty-state page-pad">
                  <h1>Page not found</h1>
                  <Link className="button primary" to="/">
                    Go home
                  </Link>
                </div>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
