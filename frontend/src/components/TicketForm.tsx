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
      style={{
        maxWidth: "500px",
        margin: "0 auto 1rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem" }}>New Ticket</h3>

      {error && (
        <div
          style={{
            background: "#fdecea",
            color: "#e74c3c",
            padding: "0.5rem",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: "0.5rem" }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      <div style={{ marginBottom: "0.5rem" }}>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority)}
          style={{
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "0.5rem 1rem",
          background: submitting ? "#85c1e9" : "#3498db",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}
