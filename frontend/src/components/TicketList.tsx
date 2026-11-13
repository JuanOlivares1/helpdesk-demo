import { useEffect, useState } from "react";
import { ticketApi, getApiError } from "../api";
import { useNavigate } from "react-router-dom";

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      try {
        const response = await ticketApi.list(1, 50, statusFilter || undefined);
        if (!cancelled) {
          setTickets(response.data.tickets);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err, "Failed to fetch tickets"));
        }
      }
    };

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  return (
    <div style={{ maxWidth: "900px", margin: "1rem auto", padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h2>Tickets</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

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
                    background:
                      ticket.status === "open"
                        ? "#e74c3c"
                        : ticket.status === "in_progress"
                        ? "#f39c12"
                        : "#2ecc71",
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

      {tickets.length === 0 && (
        <p style={{ textAlign: "center", color: "#999" }}>No tickets found</p>
      )}
    </div>
  );
}
