// Guards a page: redirects to auth if not logged in,
// or if the required role doesn't match.
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ role, onRedirect, children }) => {
  const { auth } = useAuth();

  if (!auth) {
    onRedirect("login");
    return null;
  }

  if (role && auth.user?.role !== role) {
    // wrong role — send to their own home
    onRedirect(auth.user?.role === "admin" ? "dashboard" : "home");
    return null;
  }

  return children;
};

export default ProtectedRoute;
