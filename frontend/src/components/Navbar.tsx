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
      aria-label="Main navigation"
      className="border-b border-ink/80 bg-ink text-white"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-sm font-semibold focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-md bg-signal font-mono text-xs font-semibold"
            >
              H
            </span>
            HelpDesk
          </Link>
          {token && (
            <Link
              to="/"
              className="hidden rounded-sm text-sm text-white/70 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:inline-block"
            >
              Tickets
            </Link>
          )}
          {token && user?.role === "admin" && (
            <Link
              to="/users"
              className="rounded-sm text-sm text-white/70 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Users
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {token && user && (
            <>
              <span className="hidden truncate text-sm text-white/60 lg:inline">
                {user.email}
              </span>
              <span className="hidden rounded-full border border-white/20 px-2.5 py-1 text-xs text-white/80 sm:inline-flex">
                {user.role}
              </span>
            </>
          )}

          {token ? (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger btn-sm focus-visible:ring-critical focus-visible:ring-offset-ink"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-sm text-sm text-white/75 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-sm text-sm text-white/75 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
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
