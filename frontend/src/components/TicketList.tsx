import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiError, ticketApi } from "../api";
import { useAuth } from "../auth/useAuth";
import { formatDate } from "../lib/format";
import {
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "../ticket-meta";
import type { Ticket, TicketStatus } from "../types";
import Alert from "./Alert";
import NewTicketDialog from "./NewTicketDialog";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

function isStatus(value: string | null): value is TicketStatus {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

export default function TicketList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const rawStatus = searchParams.get("status");
  const statusFilter = isStatus(rawStatus) ? rawStatus : "";
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const canCreate = user?.role === "admin" || user?.role === "client";
  const showForm = canCreate && searchParams.get("new") === "1";

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      setError("");
      setLoading(true);

      try {
        const response = await ticketApi.list(
          page,
          PAGE_SIZE,
          statusFilter || undefined,
        );
        if (!cancelled) {
          setTickets(response.data.tickets);
          setTotal(response.data.total);
          setPages(response.data.pages);
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
  }, [page, statusFilter, refreshKey]);

  const hrefFor = (status: string, targetPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/?${query}` : "/";
  };

  const openForm = () => {
    const next = new URLSearchParams(searchParams);
    next.set("new", "1");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  };

  const handleCreated = () => {
    closeForm();
    setRefreshKey((key) => key + 1);
  };

  const filterOptions = [
    { value: "", label: "All" },
    ...STATUS_OPTIONS,
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Tickets</h1>
          <p className="mt-1 text-sm text-muted">
            {total} {total === 1 ? "request" : "requests"} in view
          </p>
        </div>
        {canCreate && (
          <button type="button" onClick={openForm} className="btn btn-primary">
            New ticket
          </button>
        )}
      </header>

      <nav
        aria-label="Filter tickets by status"
        className="mt-6 flex flex-wrap gap-2"
      >
        {filterOptions.map((option) => {
          const active = statusFilter === option.value;
          return (
            <Link
              key={option.value || "all"}
              to={hrefFor(option.value, 1)}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line bg-surface text-muted hover:border-accent/40 hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="panel mt-5 px-6 py-14 text-center text-sm text-muted"
        >
          Loading tickets…
        </div>
      ) : tickets.length === 0 ? (
        <div className="panel mt-5 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="font-mono text-xs font-semibold text-faint">
            No matches
          </p>
          <h2 className="text-lg font-semibold text-ink">
            {statusFilter
              ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} tickets`
              : "No tickets yet"}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {statusFilter
              ? "Try another status to see more requests."
              : "Create the first ticket to start tracking requests."}
          </p>
          {canCreate && !statusFilter && (
            <button type="button" onClick={openForm} className="btn btn-secondary mt-2">
              New ticket
            </button>
          )}
        </div>
      ) : (
        <section aria-label="Ticket list" className="panel mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">Tickets in the current view</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Title</th>
                  <th scope="col">Status</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-mono text-xs tabular-nums text-muted">
                      {ticket.id}
                    </td>
                    <td className="min-w-0 max-w-xs">
                      <Link
                        to={`/ticket/${ticket.id}`}
                        className="block truncate rounded-sm font-medium text-ink hover:text-accent-ink focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`badge ${STATUS_BADGE_CLASS[ticket.status]}`}
                      >
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`badge ${PRIORITY_BADGE_CLASS[ticket.priority]}`}
                      >
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">
                      {formatDate(ticket.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} status={statusFilter} />
        </section>
      )}

      <NewTicketDialog
        open={showForm}
        onClose={closeForm}
        onSuccess={handleCreated}
      />
    </main>
  );
}
