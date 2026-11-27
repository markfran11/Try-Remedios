import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "remedios_auth";

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [auth,    setAuth]    = useState(null);
  const [checking, setChecking] = useState(true); // true while verifying token

  // On mount — verify any stored token with the backend
  useEffect(() => {
    const stored = loadStored();

    if (!stored?.token) {
      // No stored session — go straight to login
      setChecking(false);
      return;
    }

    // Verify the token is still valid
    fetch(`${API_BASE}/user/verify`, {
      headers: { Authorization: `Bearer ${stored.token}` },
    })
      .then((res) => {
        if (res.ok) {
          setAuth(stored); // token still valid, restore session
        } else {
          localStorage.removeItem(STORAGE_KEY); // expired/invalid — force login
        }
      })
      .catch(() => {
        // Backend unreachable — still clear the session so login shows
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = (token, user) => {
    const payload = { token, user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth(payload);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  };

  // Show nothing while checking — prevents flash of wrong screen
  if (checking) return null;

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
