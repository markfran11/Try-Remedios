import { useAuth } from "../context/AuthContext";

// Dashboard is NOT listed here — it is the landing page after login,
// not a nav destination from within the app.
export const adminLinks = [
  { id: "pos-orders", label: "POS & Customer Orders", icon: "🛒" },
  { id: "inventory",  label: "Inventory",              icon: "📦" },
  { id: "analytics",  label: "Analytics",              icon: "📊" },
  { id: "promotions", label: "Promotions",             icon: "🏷️" },
];

const Sidebar = ({ current, onNavigate }) => {
  const { auth, logout } = useAuth();
  const user = auth?.user;

  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Admin";

  return (
    <aside className="sidebar">
      {/* Brand — clicking takes back to dashboard */}
      <div className="brand" style={{ cursor: "pointer" }} onClick={() => onNavigate("dashboard")}>
        <div className="logo">R</div>
        <div>
          <strong>Remedios</strong>
          <small>Plastic Ware &amp; Native Products</small>
        </div>
      </div>

      {/* Nav links */}
      <nav aria-label="Admin navigation">
        {adminLinks.map((link) => (
          <button
            key={link.id}
            className={`sidebar-link${current === link.id ? " active" : ""}`}
            onClick={() => onNavigate(link.id)}
            aria-current={current === link.id ? "page" : undefined}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </nav>

      {/* Footer — full name above "Administrator" */}
      <div className="sidebar-footer">
        <span className="sidebar-user">{fullName}</span>
        <span className="sidebar-role">Administrator</span>
        <button className="sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </aside>
  );
};

export default Sidebar;
