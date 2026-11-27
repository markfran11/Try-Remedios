import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS, apiFetch } from "../../services/api";

export default function Login({ onGoRegister }) {
  const { login } = useAuth();
  const [form,     setForm]     = useState({ email: "", password: "" });
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email && !form.password) {
      setError("Email and password are required!");
      return;
    }
    if (!form.email) {
      setError("Email is required!");
      return;
    }
    if (!form.password) {
      setError("Password is required!");
      return;
    }

    setLoading(true);
    try {
      const body = await apiFetch(ENDPOINTS.login, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      login(body.token, body.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-logo">R</div>
        <div>
          <strong>Remedios</strong>
          <small>Plastic Ware &amp; Native Products</small>
        </div>
      </div>

      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-sub">Sign in to your account to continue</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email"
            placeholder="you@email.com"
            value={form.email} onChange={setField} required />
        </div>

        <div className="input-field">
          <label htmlFor="password">Password</label>
          <div className="access-code-wrap">
            <input id="password" name="password"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={form.password} onChange={setField} required />
            <button
              type="button"
              className="toggle-vis"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <p className="notice error" role="alert" style={{ margin: 0 }}>
            <span>{error}</span>
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button className="link-btn" onClick={onGoRegister}>Sign Up</button>
      </p>
    </div>
  );
}
