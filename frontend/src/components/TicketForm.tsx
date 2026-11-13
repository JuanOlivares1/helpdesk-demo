import { useState } from "react";
import { getApiError, ticketApi } from "../api";
import { PRIORITY_OPTIONS } from "../ticket-meta";
import type { TicketPriority } from "../types";

interface TicketFormProps {
  onSuccess: () => void;
}

export default function TicketForm({ onSuccess }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await ticketApi.create(title, description, priority);
      setTitle("");
      setDescription("");
      setPriority("medium");
      onSuccess();
    } catch (err) {
      setError(getApiError(err, "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mb-4 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 className="mb-3 text-lg font-semibold text-slate-900">New Ticket</h3>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="mb-2">
        <input
          className="input"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="mb-2">
        <textarea
          className="input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
        />
      </div>

      <div className="mb-3">
        <select
          className="input w-auto"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority)}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}
