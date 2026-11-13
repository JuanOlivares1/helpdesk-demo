import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketApi, getApiError } from "../api";

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Comment {
  id: number;
  body: string;
  created_at: string;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadTicket = async () => {
      try {
        const ticketRes = await ticketApi.get(Number(id));
        const commentsRes = await ticketApi.getComments(Number(id));
        if (!cancelled) {
          setTicket(ticketRes.data.ticket);
          setComments(commentsRes.data.comments);
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

    try {
      await ticketApi.addComment(Number(id), newComment);
      setNewComment("");
      const commentsRes = await ticketApi.getComments(Number(id));
      setComments(commentsRes.data.comments);
    } catch (err) {
      setError(getApiError(err, "Failed to add comment"));
    }
  };

  if (error)
    return (
      <div style={{ color: "#e74c3c", textAlign: "center", marginTop: "2rem" }}>
        {error}
      </div>
    );
  if (!ticket)
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>
    );

  return (
    <div style={{ maxWidth: "800px", margin: "1rem auto", padding: "1rem" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem",
          background: "#eee",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ← Back to tickets
      </button>

      <h2>{ticket.title}</h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
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
          }}
        >
          {ticket.status}
        </span>
        <span
          style={{
            padding: "0.25rem 0.5rem",
            background: "#eee",
            borderRadius: "4px",
          }}
        >
          {ticket.priority}
        </span>
      </div>

      <p style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>
      <p style={{ color: "#999", fontSize: "0.8rem" }}>
        Created: {new Date(ticket.created_at).toLocaleString()}
      </p>

      <hr style={{ margin: "2rem 0" }} />

      <h3>Comments ({comments.length})</h3>

      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            padding: "0.75rem",
            background: "#f9f9f9",
            borderRadius: "4px",
            marginBottom: "0.5rem",
          }}
        >
          <p>{comment.body}</p>
          <small style={{ color: "#999" }}>
            {new Date(comment.created_at).toLocaleString()}
          </small>
        </div>
      ))}

      <form onSubmit={handleAddComment} style={{ marginTop: "1.5rem" }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginBottom: "0.5rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Add Comment
        </button>
      </form>
    </div>
  );
}
