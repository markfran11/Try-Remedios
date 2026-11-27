import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS, apiFetch } from "../../services/api";

export default function Register({ onGoLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName:       "",
    lastName:        "",
    username:        "",
    email:           "",
    password:        "",
    confirmPassword: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await apiFetch(ENDPOINTS.register, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          firstName: form.firstName,
          lastName:  form.lastName,
          username:  form.username,
          email:     form.email,
          password:  form.password,
        }),
      });

      // auto-login after successful registration
      const session = await apiFetch(ENDPOINTS.login, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      login(session.token, session.user);
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

      <h2 className="auth-title">Create an account</h2>
      <p className="auth-sub">Sign up to start browsing and ordering</p>

      <form className="auth-form" onSubmit={handleSubmit}>

        <div className="auth-name-row">
          <div className="input-field">
            <label htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" placeholder="Juan"
              value={form.firstName} onChange={setField} required />
          </div>
          <div className="input-field">
            <label htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" placeholder="dela Cruz"
              value={form.lastName} onChange={setField} required />
          </div>
        </div>

        <div className="input-field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" placeholder="juandelacruz"
            value={form.username} onChange={setField} required autoComplete="username" />
        </div>

        <div className="input-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@email.com"
            value={form.email} onChange={setField} required />
        </div>

        <div className="input-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password"
            placeholder="At least 6 characters"
            value={form.password} onChange={setField} required />
        </div>

        <div className="input-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password"
            placeholder="••••••••"
            value={form.confirmPassword} onChange={setField} required />
        </div>

        {error && (
          <p className="notice error" role="alert" style={{ margin: 0 }}>
            <span>{error}</span>
          </p>
        )}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <button className="link-btn" onClick={onGoLogin}>Sign in</button>
      </p>
    </div>
  );
}
