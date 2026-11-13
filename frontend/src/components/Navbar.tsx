import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav
      style={{
        padding: "1rem",
        background: "#1a1a2e",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link
          to="/"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          HelpDesk
        </Link>
        {token && (
          <Link to="/" style={{ color: "#ccc", textDecoration: "none" }}>
            Tickets
          </Link>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {token && user && (
          <span style={{ color: "#ccc", fontSize: "0.9rem" }}>
            {user.email} ({user.role})
          </span>
        )}

        {token ? (
          <button
            onClick={handleLogout}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={{ color: "#ccc", textDecoration: "none" }}>
              Login
            </Link>
            <Link
              to="/register"
              style={{ color: "#ccc", textDecoration: "none" }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
