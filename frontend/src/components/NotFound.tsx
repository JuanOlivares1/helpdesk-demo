import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main id="main" className="auth-main">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-semibold text-signal">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">
          That page isn’t on the queue.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          The address may be outdated, or the page may have moved. Head back to
          your tickets to keep working.
        </p>
        <Link to="/" className="btn btn-primary mt-6">
          Back to tickets
        </Link>
      </div>
    </main>
  );
}
