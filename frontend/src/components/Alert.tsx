import type { ReactNode } from "react";

type AlertTone = "error" | "success" | "info";

interface AlertProps {
  tone?: AlertTone;
  className?: string;
  children: ReactNode;
}

const MARKER: Record<AlertTone, string> = {
  error: "!",
  success: "✓",
  info: "i",
};

export default function Alert({
  tone = "error",
  className = "",
  children,
}: AlertProps) {
  const live = tone === "error" ? "assertive" : "polite";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={live}
      className={`alert alert-${tone} ${className}`.trim()}
    >
      <span aria-hidden="true" className="font-mono text-xs font-semibold">
        {MARKER[tone]}
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}
