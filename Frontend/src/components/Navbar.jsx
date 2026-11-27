// Customer-facing top navbar shown on all customer pages.
import { useAuth } from "../context/AuthContext";

const Navbar = ({ current, onNavigate }) => {
  const { auth, logout } = useAuth();
  const user = auth?.user;

  const links = [
    { id: "home",      label: "Home" },
    { id: "shop",      label: "Shop" },
    { id: "my-orders", label: "My Orders" },
  ];

  return (
    <header className="customer-navbar">
      <div className="customer-navbar-brand">
        <span className="customer-navbar-logo">R</span>
        <span className="customer-navbar-name">Remedios</span>
      </div>

      <nav className="customer-navbar-links">
        {links.map((link) => (
          <button
            key={link.id}
            className={`customer-nav-link${current === link.id ? " active" : ""}`}
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="customer-navbar-user">
        <span className="customer-navbar-greeting">
          Hi, {user?.firstName ?? "Guest"}
        </span>
        <button className="customer-navbar-logout" onClick={logout}>
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
