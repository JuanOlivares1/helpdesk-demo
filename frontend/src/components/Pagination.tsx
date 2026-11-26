import { Link } from "react-router-dom";

interface PaginationProps {
  page: number;
  pages: number;
  status: string;
}

function pageHref(page: number, status: string): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default function Pagination({ page, pages, status }: PaginationProps) {
  if (pages <= 1) return null;

  const disabledClass = "cursor-not-allowed text-ink/35";
  const linkClass =
    "rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <nav
      aria-label="Ticket pages"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3"
    >
      {page > 1 ? (
        <Link className={linkClass} to={pageHref(page - 1, status)}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`px-3 py-1.5 text-xs ${disabledClass}`}>
          Previous
        </span>
      )}

      <span aria-live="polite" className="font-mono text-xs text-muted">
        Page {page} of {pages}
      </span>

      {page < pages ? (
        <Link className={linkClass} to={pageHref(page + 1, status)}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={`px-3 py-1.5 text-xs ${disabledClass}`}>
          Next
        </span>
      )}
    </nav>
  );
}
