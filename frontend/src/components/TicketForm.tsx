import { useEffect, useRef, useState } from "react";
import { getApiError, getFieldErrors, ticketApi } from "../api";
import { PRIORITY_OPTIONS } from "../ticket-meta";
import type { TicketPriority } from "../types";
import Alert from "./Alert";
import Field from "./Field";

interface TicketFormProps {
  onSuccess: () => void;
}

export default function TicketForm({ onSuccess }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      await ticketApi.create(title.trim(), description.trim(), priority);
      setTitle("");
      setDescription("");
      setPriority("medium");
      onSuccess();
    } catch (err) {
      const errors = getFieldErrors(err);
      setFieldErrors(errors);
      setError(
        Object.keys(errors).length > 0
          ? "Check the highlighted fields."
          : getApiError(err, "Ticket creation failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [fieldErrors]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate={false}>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        <Field label="Title" error={fieldErrors.title}>
          {({ id, invalid, describedBy }) => (
            <input
              id={id}
              name="title"
              className="input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Checkout fails on mobile…"
              maxLength={200}
              autoComplete="off"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              required
            />
          )}
        </Field>

        <Field
          label="Description"
          hint="Include what happened and what you expected."
          error={fieldErrors.description}
        >
          {({ id, invalid, describedBy }) => (
            <textarea
              id={id}
              name="description"
              className="input min-h-24 resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue…"
              maxLength={10000}
              autoComplete="off"
              rows={4}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              required
            />
          )}
        </Field>

        <Field label="Priority" error={fieldErrors.priority}>
          {({ id, invalid, describedBy }) => (
            <select
              id={id}
              name="priority"
              className="input"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TicketPriority)
              }
              aria-invalid={invalid}
              aria-describedby={describedBy}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
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
          {submitting ? "Creating ticket…" : "Create ticket"}
        </button>
      </div>
    </form>
  );
}
