export const adminLinks = [
  { id: "dashboard",      label: "Dashboard" },
  { id: "pos",            label: "POS" },
  { id: "orders",         label: "Orders" },
  { id: "sales",          label: "Transaction History" },
  { id: "products",       label: "Products" },
  { id: "inventory",      label: "Inventory" },
  { id: "stock-movement", label: "Stock Movement" },
  { id: "promotions",     label: "Promotions" },
  { id: "reports",        label: "Sales Analytics" },
];

const SideNavbar = ({ current, user, onLogout }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="logo">R</div>
      <div>
        <strong>Remedios</strong>
        <small>Plastic Ware &amp; Native Products</small>
      </div>
    </div>
    <nav aria-label="Admin">
      {adminLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          aria-current={current === link.id ? "page" : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
    <div className="sidebar-footer">
      <span className="sidebar-user">{user?.fullName ?? "Admin"}</span>
      <button className="sidebar-logout" onClick={onLogout}>Sign Out</button>
    </div>
  </aside>
);

export default SideNavbar;
