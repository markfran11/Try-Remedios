import Navbar from "../components/Navbar";

const CustomerLayout = ({ current, onNavigate, children }) => (
  <div className="customer-layout">
    <Navbar current={current} onNavigate={onNavigate} />
    <main className="customer-content">{children}</main>
  </div>
);

export default CustomerLayout;
