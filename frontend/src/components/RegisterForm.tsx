import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, getApiError } from "../api";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await authApi.register(email, password);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(getApiError(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mt-8 max-w-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Register</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="mb-4">
        <label className="label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="mb-4">
        <label className="label" htmlFor="register-password">
          Password
        </label>
        <input
          id="register-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <small className="mt-1 block text-xs text-slate-500">
          At least 8 characters.
        </small>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-success w-full"
      >
        {submitting ? "Creating account..." : "Register"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-medium text-blue-600 hover:underline" to="/login">
          Login
        </Link>
      </p>
    </form>
  );
}
