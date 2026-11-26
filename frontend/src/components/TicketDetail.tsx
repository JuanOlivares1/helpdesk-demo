import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiError, ticketApi, usersApi } from "../api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/format";
import {
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "../ticket-meta";
import type {
  Assignee,
  Comment,
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketUpdatePayload,
} from "../types";
import Alert from "./Alert";
import Field from "./Field";
import StatusRail from "./StatusRail";

interface Draft {
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: number | null;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const validId = Boolean(id) && Number.isInteger(ticketId);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [draft, setDraft] = useState<Draft>({
    status: "open",
    priority: "medium",
    assigneeId: null,
  });
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [assigneeError, setAssigneeError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updating, setUpdating] = useState(false);
  const commentRef = useRef<HTMLFormElement>(null);
  const { user } = useAuth();

  const canManage = user?.role === "admin" || user?.role === "agent";

  useEffect(() => {
    if (!validId) return;

    let cancelled = false;

    const loadTicket = async () => {
      try {
        const [ticketResponse, commentsResponse] = await Promise.all([
          ticketApi.get(ticketId),
          ticketApi.getComments(ticketId),
        ]);

        if (!cancelled) {
          const loaded = ticketResponse.data.ticket;
          setTicket(loaded);
          setComments(commentsResponse.data.comments);
          setDraft({
            status: loaded.status,
            priority: loaded.priority,
            assigneeId: loaded.assignee_id,
          });
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err, "Failed to fetch ticket"));
        }
      }
    };

    void loadTicket();

    return () => {
      cancelled = true;
    };
  }, [ticketId, validId]);

  useEffect(() => {
    if (!canManage) return;

    let cancelled = false;

    const loadAssignees = async () => {
      try {
        const response = await usersApi.listAssignees();
        if (!cancelled) {
          setAssignees(response.data.assignees);
          setAssigneeError("");
        }
      } catch (err) {
        if (!cancelled) {
          setAssigneeError(getApiError(err, "Failed to load assignees"));
        }
      }
    };

    void loadAssignees();

    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validId || !newComment.trim()) return;

    setCommentError("");
    setSubmittingComment(true);

    try {
      await ticketApi.addComment(ticketId, newComment.trim());
      setNewComment("");
      const commentsResponse = await ticketApi.getComments(ticketId);
      setComments(commentsResponse.data.comments);
    } catch (err) {
      setCommentError(getApiError(err, "Failed to add comment"));
      requestAnimationFrame(() => {
        commentRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) return;

    const changes: TicketUpdatePayload = {};
    if (draft.status !== ticket.status) changes.status = draft.status;
    if (canManage && draft.priority !== ticket.priority) {
      changes.priority = draft.priority;
    }
    if (canManage && draft.assigneeId !== ticket.assignee_id) {
      changes.assignee_id = draft.assigneeId;
    }

    if (Object.keys(changes).length === 0) {
      setUpdateError("");
      setUpdateSuccess("No changes to save.");
      return;
    }

    setUpdateError("");
    setUpdateSuccess("");
    setUpdating(true);

    try {
      const response = await ticketApi.update(ticket.id, changes);
      setTicket(response.data.ticket);
      setUpdateSuccess("Ticket updated.");
    } catch (err) {
      setUpdateError(getApiError(err, "Failed to update ticket"));
    } finally {
      setUpdating(false);
    }
  };

  if (!validId) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Alert tone="error">
          That ticket link is invalid. Return to the ticket list and choose a
          request.
        </Alert>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Alert tone="error">{error}</Alert>
        <Link to="/" className="btn btn-secondary mt-4">
          Back to tickets
        </Link>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p role="status" aria-live="polite" className="text-sm text-muted">
          Loading ticket…
        </p>
      </main>
    );
  }

  const statusOptions = canManage
    ? STATUS_OPTIONS
    : STATUS_OPTIONS.filter(
        (option) => option.value === "resolved" || option.value === "closed",
      );

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="inline-flex rounded-sm text-sm text-muted hover:text-accent-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Back to tickets
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">
            Ticket #{ticket.id}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-ink break-words">
            {ticket.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_BADGE_CLASS[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className={`badge ${PRIORITY_BADGE_CLASS[ticket.priority]}`}>
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
        </div>
        <p className="font-mono text-xs text-muted tabular-nums">
          Opened {formatDateTime(ticket.created_at)}
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="description-title" className="panel p-5">
            <h2 id="description-title" className="text-sm font-semibold text-ink">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80 break-words">
              {ticket.description}
            </p>
          </section>

          <section aria-labelledby="comments-title" className="panel p-5">
            <h2 id="comments-title" className="text-sm font-semibold text-ink">
              Comments ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No comments yet. Add the first update below.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    className="rounded-md border border-line bg-paper/60 p-3"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85 break-words">
                      {comment.body}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-muted tabular-nums">
                      User #{comment.author_id} ·{" "}
                      {formatDateTime(comment.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            <form ref={commentRef} onSubmit={handleAddComment} className="mt-5">
              <Field
                label="Add a comment"
                hint="Keep the update focused on this ticket."
              >
                {({ id, describedBy }) => (
                  <textarea
                    id={id}
                    name="comment"
                    className="input min-h-20 resize-y"
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Describe the update…"
                    maxLength={5000}
                    rows={3}
                    aria-describedby={describedBy}
                  />
                )}
              </Field>

              {commentError && (
                <Alert tone="error" className="mt-3">
                  {commentError}
                </Alert>
              )}

              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="btn btn-secondary mt-3"
              >
                {submittingComment && (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/25 border-t-ink motion-reduce:hidden"
                  />
                )}
                {submittingComment ? "Adding comment…" : "Add comment"}
              </button>
            </form>
          </section>
        </div>

        <aside aria-label="Ticket details" className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-sm font-semibold text-ink">Progress</h2>
            <div className="mt-4">
              <StatusRail status={ticket.status} />
            </div>
          </section>

          <section aria-labelledby="triage-title" className="panel p-5">
            <h2 id="triage-title" className="text-sm font-semibold text-ink">
              Triage
            </h2>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <Field label="Status">
                {({ id }) => (
                  <select
                    id={id}
                    name="status"
                    className="input"
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        status: event.target.value as TicketStatus,
                      }))
                    }
                  >
                    {!canManage &&
                      !statusOptions.some(
                        (option) => option.value === draft.status,
                      ) && (
                        <option value={draft.status} disabled>
                          {STATUS_LABELS[draft.status]} (current)
                        </option>
                      )}
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {canManage && (
                <Field label="Priority">
                  {({ id }) => (
                    <select
                      id={id}
                      name="priority"
                      className="input"
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          priority: event.target.value as TicketPriority,
                        }))
                      }
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              )}

              {canManage ? (
                <Field label="Assignee">
                  {({ id }) => (
                    <select
                      id={id}
                      name="assignee"
                      className="input"
                      value={draft.assigneeId ?? ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          assigneeId: event.target.value
                            ? Number(event.target.value)
                            : null,
                        }))
                      }
                    >
                      <option value="">
                        Unassigned{draft.assigneeId === null ? " (current)" : ""}
                      </option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.email} ({assignee.role})
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <div>
                  <span className="label">Assignee</span>
                  <p className="text-sm text-muted">
                    {ticket.assignee_id
                      ? `User #${ticket.assignee_id}`
                      : "Unassigned"}
                  </p>
                </div>
              )}

              {assigneeError && (
                <Alert tone="error">{assigneeError}</Alert>
              )}
              {updateError && (
                <Alert tone="error">{updateError}</Alert>
              )}
              {updateSuccess && (
                <Alert tone="success">{updateSuccess}</Alert>
              )}

              <button
                type="submit"
                disabled={updating}
                className="btn btn-primary w-full"
              >
                {updating && (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-current motion-reduce:hidden"
                  />
                )}
                {updating ? "Saving changes…" : "Save changes"}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}
