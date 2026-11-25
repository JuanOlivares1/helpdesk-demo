import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiError, getFieldErrors } from "../api";
import { useAuth } from "../auth/useAuth";
import Alert from "./Alert";
import Field from "./Field";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = (
    location.state as { registered?: boolean } | null
  )?.registered;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      setError(
        Object.keys(errors).length > 0
          ? "Check the highlighted fields."
          : getApiError(err, "Sign in failed"),
      );
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside aria-label="About HelpDesk" className="auth-aside">
        <div>
          <p className="font-mono text-xs text-white/70">HelpDesk / Support desk</p>
          <p className="mt-8 max-w-sm text-3xl font-semibold leading-tight text-balance">
            Support requests, tracked clearly.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Give every issue an owner, a status, and a history your team can
            trust.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-white/80">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/80" />
            Open to closed, without guesswork
          </li>
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white/80" />
            Priority and ownership stay visible
          </li>
        </ul>
        <p className="font-mono text-xs text-white/50">
          © {new Date().getFullYear()} HelpDesk
        </p>
      </aside>

      <main id="main" className="auth-main">
        <form ref={formRef} onSubmit={handleSubmit} className="auth-card">
          <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink/60">Welcome back. Enter your details.</p>

          {registered && !error && (
            <Alert tone="success" className="mt-5">
              Account created. Sign in to continue.
            </Alert>
          )}

          {error && (
            <Alert tone="error" className="mt-5">
              {error}
            </Alert>
          )}

          <div className="mt-6 space-y-4">
            <Field label="Email" error={fieldErrors.email}>
              {({ id, invalid, describedBy }) => (
                <input
                  id={id}
                  name="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  required
                />
              )}
            </Field>

            <Field label="Password" error={fieldErrors.password}>
              {({ id, invalid, describedBy }) => (
                <input
                  id={id}
                  name="password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  required
                />
              )}
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary mt-6 w-full"
          >
            {submitting && (
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:hidden"
              />
            )}
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-ink/60">
            New here?{" "}
            <Link
              to="/register"
              className="rounded-sm font-medium text-signal hover:underline focus-visible:ring-2 focus-visible:ring-signal"
            >
              Create an account
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
