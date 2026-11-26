import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

type Theme = "system" | "light" | "dark";

const THEME_ORDER: Theme[] = ["system", "light", "dark"];
const THEME_LABEL: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme): void {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", dark);
  document
    .getElementById("theme-color")
    ?.setAttribute("content", dark ? "#0e1518" : "#f6f8f7");
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (theme === "dark") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  );
}

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(readTheme);
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  const themeLabel = `Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[nextTheme].toLowerCase()}.`;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(theme);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);

  const cycleTheme = () => {
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
    setTheme(nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-line bg-header text-on-header"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-sm font-semibold focus-visible:ring-2 focus-visible:ring-on-header/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header"
          >
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-xs font-semibold text-on-accent"
            >
              H
            </span>
            HelpDesk
          </Link>
          {token && (
            <Link
              to="/"
              className="hidden rounded-sm text-sm text-on-header/70 hover:text-on-header focus-visible:ring-2 focus-visible:ring-on-header/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header sm:inline-block"
            >
              Tickets
            </Link>
          )}
          {token && user?.role === "admin" && (
            <Link
              to="/users"
              className="rounded-sm text-sm text-on-header/70 hover:text-on-header focus-visible:ring-2 focus-visible:ring-on-header/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header"
            >
              Users
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {token && user && (
            <>
              <span className="hidden truncate text-sm text-on-header/60 lg:inline">
                {user.email}
              </span>
              <span className="hidden rounded-full border border-on-header/20 px-2.5 py-1 text-xs text-on-header/80 sm:inline-flex">
                {user.role}
              </span>
            </>
          )}

          <button
            type="button"
            onClick={cycleTheme}
            aria-label={themeLabel}
            title={themeLabel}
            className="grid h-10 w-10 place-items-center rounded-md border border-on-header/20 text-on-header/80 hover:bg-on-header/10 hover:text-on-header focus-visible:ring-2 focus-visible:ring-on-header/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header motion-safe:transition-colors motion-safe:duration-150"
          >
            <ThemeIcon theme={theme} />
          </button>

          {token ? (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger btn-sm focus-visible:ring-critical focus-visible:ring-offset-header"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-sm text-sm text-on-header/75 hover:text-on-header focus-visible:ring-2 focus-visible:ring-on-header/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-sm text-sm text-on-header/75 hover:text-on-header focus-visible:ring-2 focus-visible:ring-on-header/70 focus-visible:ring-offset-2 focus-visible:ring-offset-header"
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
