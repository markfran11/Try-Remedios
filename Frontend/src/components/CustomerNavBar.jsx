export const customerLinks = [
  { id: "browse",    label: "Browse Products" },
  { id: "my-orders", label: "My Orders" },
];

const CustomerNavBar = ({ current, user, onLogout }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="logo">R</div>
      <div>
        <strong>Remedios</strong>
        <small>Plastic Ware &amp; Native Products</small>
      </div>
    </div>
    <nav aria-label="Customer">
      {customerLinks.map((link) => (
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
      <span className="sidebar-user">{user?.fullName}</span>
      <button className="sidebar-logout" onClick={onLogout}>Sign Out</button>
    </div>
  </aside>
);

export default CustomerNavBar;
