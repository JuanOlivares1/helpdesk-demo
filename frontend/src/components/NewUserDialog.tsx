import { useEffect, useRef, useState } from "react";
import { getApiError, getFieldErrors, usersApi } from "../api";
import type { Role } from "../types";
import Alert from "./Alert";
import Field from "./Field";

interface NewUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "agent", label: "Agent" },
  { value: "admin", label: "Admin" },
];

export default function NewUserDialog({
  open,
  onClose,
  onSuccess,
}: NewUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = () => onClose();
    dialog.addEventListener("cancel", handleCancel);

    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  useEffect(() => {
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [fieldErrors]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      await usersApi.create({ email: email.trim(), password, role });
      setEmail("");
      setPassword("");
      setRole("client");
      onSuccess();
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      setError(
        Object.keys(errors).length > 0
          ? "Check the highlighted fields."
          : getApiError(err, "Failed to create user"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-user-title"
      className="dialog"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="new-user-title" className="text-lg font-semibold text-ink">
            New user
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add an account and choose its access level.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close new user dialog"
          className="btn btn-ghost btn-sm"
        >
          Close
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-5">
        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <Field label="Email" error={fieldErrors.email}>
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                name="email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                maxLength={120}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                required
              />
            )}
          </Field>

          <Field
            label="Temporary password"
            hint="At least 8 characters. Share it with the user securely."
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
                aria-invalid={invalid}
                aria-describedby={describedBy}
                required
              />
            )}
          </Field>

          <Field label="Access role" error={fieldErrors.role}>
            {({ id, invalid, describedBy }) => (
              <select
                id={id}
                name="role"
                className="input"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting && (
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current motion-reduce:hidden"
              />
            )}
            {submitting ? "Creating user…" : "Create user"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
