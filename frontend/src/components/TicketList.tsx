import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiError, ticketApi } from "../api";
import { useAuth } from "../auth/useAuth";
import { STATUS_OPTIONS, statusColor } from "../ticket-meta";
import type { Ticket, TicketStatus } from "../types";
import TicketForm from "./TicketForm";

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "client";

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      setError("");
      setLoading(true);

      try {
        const response = await ticketApi.list(
          1,
          50,
          statusFilter || undefined
        );
        if (!cancelled) {
          setTickets(response.data.tickets);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err, "Failed to fetch tickets"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, refreshKey]);

  const handleCreated = () => {
    setShowForm(false);
    setRefreshKey((key) => key + 1);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "1rem auto", padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h2>Tickets</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TicketStatus | "")
            }
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {canCreate && (
            <button
              onClick={() => setShowForm((visible) => !visible)}
              style={{
                padding: "0.5rem 1rem",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showForm ? "Cancel" : "New Ticket"}
            </button>
          )}
        </div>
      </div>

      {showForm && <TicketForm onSuccess={handleCreated} />}

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

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Loading tickets...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Title
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Priority
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #ddd",
                }}
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => navigate(`/ticket/${ticket.id}`)}
                style={{ cursor: "pointer", borderBottom: "1px solid #ddd" }}
              >
                <td style={{ padding: "0.75rem" }}>{ticket.id}</td>
                <td style={{ padding: "0.75rem" }}>{ticket.title}</td>
                <td style={{ padding: "0.75rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      background: statusColor(ticket.status),
                      color: "white",
                      fontSize: "0.8rem",
                    }}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>{ticket.priority}</td>
                <td style={{ padding: "0.75rem" }}>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && tickets.length === 0 && (
        <p style={{ textAlign: "center", color: "#999" }}>No tickets found</p>
      )}
    </div>
  );
}
