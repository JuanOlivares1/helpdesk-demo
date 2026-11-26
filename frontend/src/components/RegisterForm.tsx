import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, getApiError, getFieldErrors } from "../api";
import Alert from "./Alert";
import Field from "./Field";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      await authApi.register(email, password);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      setError(
        Object.keys(errors).length > 0
          ? "Check the highlighted fields."
          : getApiError(err, "Registration failed"),
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
          <p className="font-mono text-xs text-on-accent/70">HelpDesk / Support desk</p>
          <p className="mt-8 max-w-sm text-3xl font-semibold leading-tight text-balance">
            One place for every request.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-accent/75">
            Create a ticket, follow its progress, and keep the conversation in
            context.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-on-accent/80">
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-on-accent/80" />
            Clear status at every step
          </li>
          <li className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-on-accent/80" />
            Comments tied to the right ticket
          </li>
        </ul>
        <p className="font-mono text-xs text-on-accent/70">
          © {new Date().getFullYear()} HelpDesk
        </p>
      </aside>

      <main id="main" className="auth-main">
        <form ref={formRef} onSubmit={handleSubmit} className="auth-card">
          <h1 className="text-2xl font-semibold text-ink">Create account</h1>
          <p className="mt-1 text-sm text-muted">
            Start by telling us how to reach you.
          </p>

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

            <Field
              label="Password"
              hint="Use at least 8 characters."
              error={fieldErrors.password}
            >
              {({ id, invalid, describedBy }) => (
                <input
                  id={id}
                  name="password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
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
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current motion-reduce:hidden"
              />
            )}
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="mt-5 text-center text-sm text-muted">
            Already registered?{" "}
            <Link
              to="/login"
              className="rounded-sm font-medium text-accent-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent"
            >
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
