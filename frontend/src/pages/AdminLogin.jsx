import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { admin, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const from = location.state?.from?.pathname || "/admin";

  // Si ya inició sesión, no tiene sentido mostrar el login
  if (admin) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <main className="container auth-box">
      <h2 className="page-title">Panel de administración</h2>

      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <div className="password-row">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
