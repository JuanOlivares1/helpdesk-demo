import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
      <div>
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
          <Link
            to="/login"
            style={{
              color: "#ccc",
              textDecoration: "none",
              marginRight: "1rem",
            }}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
