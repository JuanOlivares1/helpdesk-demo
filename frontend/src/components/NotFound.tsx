import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "3rem auto",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ marginBottom: "0.5rem" }}>Page not found</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        style={{
          padding: "0.75rem 1rem",
          background: "#3498db",
          color: "white",
          borderRadius: "4px",
          textDecoration: "none",
        }}
      >
        Back to tickets
      </Link>
    </div>
  );
}
