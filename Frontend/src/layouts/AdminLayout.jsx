import Sidebar from "../components/Sidebar";

const AdminLayout = ({ current, onNavigate, children }) => (
  <div className="layout">
    <Sidebar current={current} onNavigate={onNavigate} />
    <main className="content">{children}</main>
  </div>
);

export default AdminLayout;
