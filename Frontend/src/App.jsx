import { useEffect, useState } from "react";
import "./index.css";

import { useAuth } from "./context/AuthContext";

// ── Layouts ──────────────────────────────────────────────────────────────────
import AdminLayout from "./layouts/AdminLayout";

// ── Auth pages ────────────────────────────────────────────────────────────────
import Login    from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// ── Admin pages ───────────────────────────────────────────────────────────────
import POSOrders from "./pages/admin/POSOrders";
import Inventory from "./pages/admin/Inventory";

// ── Page maps ─────────────────────────────────────────────────────────────────
const ADMIN_PAGES = {
  "pos-orders": POSOrders,
  inventory:    Inventory,
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { auth } = useAuth();

  const [authView,  setAuthView]  = useState("login");
  const [adminPage, setAdminPage] = useState("inventory");

  useEffect(() => {
    if (!auth) {
      setAdminPage("inventory");
    }
  }, [auth]);

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <div className="auth-layout">
        <div className="auth-hero">
          <div className="auth-hero-inner">
            <div className="auth-hero-logo">R</div>
            <h1>Remedios</h1>
            <p>Plastic Ware &amp; Native Products</p>
            <ul className="auth-hero-bullets">
              <li>Browse and order products online</li>
              <li>Track your orders in real time</li>
              <li>Exclusive vouchers and promotions</li>
            </ul>
          </div>
        </div>
        <div className="auth-panel">
          {authView === "login"
            ? <Login    onGoRegister={() => setAuthView("register")} />
            : <Register onGoLogin={()   => setAuthView("login")} />
          }
        </div>
      </div>
    );
  }

  // ── Admin only (no customer pages for now) ────────────────────────────────
  if (auth.user?.role === "admin") {
    const AdminPage = ADMIN_PAGES[adminPage] ?? Inventory;
    return (
      <AdminLayout current={adminPage} onNavigate={setAdminPage}>
        <AdminPage onNavigate={setAdminPage} />
      </AdminLayout>
    );
  }

  // ── Customer fallback (empty for now) ─────────────────────────────────────
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Customer view coming soon</h1>
      <button onClick={() => { auth && window.location.reload(); }}>
        Logout
      </button>
    </div>
  );
}
