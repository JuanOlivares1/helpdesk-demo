import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiError } from "../api";
import { useAuth } from "../auth/useAuth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = (
    location.state as { registered?: boolean } | null
  )?.registered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getApiError(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mt-8 max-w-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Login</h2>

      {registered && !error && (
        <div className="alert alert-success">
          Account created. Please log in.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="mb-4">
        <label className="label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="mb-4">
        <label className="label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full"
      >
        {submitting ? "Signing in..." : "Login"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link className="font-medium text-blue-600 hover:underline" to="/register">
          Register
        </Link>
      </p>
    </form>
  );
}
