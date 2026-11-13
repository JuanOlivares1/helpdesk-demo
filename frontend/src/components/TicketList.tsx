import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiError, ticketApi } from "../api";
import { useAuth } from "../auth/useAuth";
import {
  PRIORITY_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_OPTIONS,
} from "../ticket-meta";
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
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Tickets</h2>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TicketStatus | "")
            }
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
              className="btn btn-primary"
            >
              {showForm ? "Cancel" : "New Ticket"}
            </button>
          )}
        </div>
      </div>

      {showForm && <TicketForm onSuccess={handleCreated} />}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading tickets...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => navigate(`/ticket/${ticket.id}`)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-500">{ticket.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {ticket.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${STATUS_BADGE_CLASS[ticket.status]}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${PRIORITY_BADGE_CLASS[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <p className="py-8 text-center text-slate-500">No tickets found</p>
      )}
    </div>
  );
}
