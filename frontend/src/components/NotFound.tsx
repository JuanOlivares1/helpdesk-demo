import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md px-4 text-center">
      <h2 className="mb-2 text-2xl font-semibold text-slate-900">
        Page not found
      </h2>
      <p className="mb-6 text-slate-600">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to tickets
      </Link>
    </div>
  );
}
