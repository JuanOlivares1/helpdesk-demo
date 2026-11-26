import { useId } from "react";
import type { ReactNode } from "react";

interface FieldRenderProps {
  id: string;
  invalid: boolean;
  describedBy?: string;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (props: FieldRenderProps) => ReactNode;
}

export default function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children({ id, invalid: Boolean(error), describedBy })}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          aria-live="polite"
          className="mt-1 text-xs font-medium text-critical"
        >
          {error}
        </p>
      )}
    </div>
  );
}
