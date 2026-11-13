import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiError, ticketApi } from "../api";
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from "../ticket-meta";
import type { Comment, Ticket } from "../types";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadTicket = async () => {
      try {
        const [ticketResponse, commentsResponse] = await Promise.all([
          ticketApi.get(Number(id)),
          ticketApi.getComments(Number(id)),
        ]);

        if (!cancelled) {
          setTicket(ticketResponse.data.ticket);
          setComments(commentsResponse.data.comments);
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
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    setCommentError("");
    setSubmittingComment(true);

    try {
      await ticketApi.addComment(Number(id), newComment.trim());
      setNewComment("");
      const commentsResponse = await ticketApi.getComments(Number(id));
      setComments(commentsResponse.data.comments);
    } catch (err) {
      setCommentError(getApiError(err, "Failed to add comment"));
    } finally {
      setSubmittingComment(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <p className="mt-8 text-center text-slate-500">Loading...</p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={() => navigate("/")} className="btn btn-secondary mb-4">
        ← Back to tickets
      </button>

      <h2 className="text-2xl font-semibold text-slate-900">{ticket.title}</h2>

      <div className="my-4 flex items-center gap-2">
        <span className={`badge ${STATUS_BADGE_CLASS[ticket.status]}`}>
          {ticket.status}
        </span>
        <span className={`badge ${PRIORITY_BADGE_CLASS[ticket.priority]}`}>
          {ticket.priority}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-slate-700">
        {ticket.description}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Created: {new Date(ticket.created_at).toLocaleString()}
      </p>

      <hr className="my-8 border-slate-200" />

      <h3 className="mb-3 text-lg font-semibold text-slate-900">
        Comments ({comments.length})
      </h3>

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="mb-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"
        >
          <p className="text-slate-700">{comment.body}</p>
          <small className="text-xs text-slate-500">
            User #{comment.author_id} ·{" "}
            {new Date(comment.created_at).toLocaleString()}
          </small>
        </div>
      ))}

      {commentError && (
        <div className="alert alert-error mt-4">{commentError}</div>
      )}

      <form onSubmit={handleAddComment} className="mt-6">
        <textarea
          className="input mb-2"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
        />
        <button
          type="submit"
          disabled={submittingComment || !newComment.trim()}
          className="btn btn-primary"
        >
          {submittingComment ? "Adding..." : "Add Comment"}
        </button>
      </form>
    </div>
  );
}
