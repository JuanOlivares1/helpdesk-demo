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
    <nav className="border-b border-slate-800 bg-slate-900 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-semibold hover:text-slate-200">
            HelpDesk
          </Link>
          {token && (
            <Link
              to="/"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Tickets
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {token && user && (
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.email} ({user.role})
            </span>
          )}

          {token ? (
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
