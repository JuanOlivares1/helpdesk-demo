import { STATUS_LABELS } from "../ticket-meta";
import type { TicketStatus } from "../types";

const STEPS: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export default function StatusRail({ status }: { status: TicketStatus }) {
  const current = STEPS.indexOf(status);

  return (
    <ol aria-label="Ticket progress" className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {STEPS.map((step, index) => {
        const active = index === current;
        const done = index < current;

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-semibold ${
                active
                  ? "bg-accent text-on-accent"
                  : done
                    ? "bg-success/15 text-success"
                    : "bg-ink/5 text-faint"
              }`}
            >
              {index + 1}
            </span>
            <span
              aria-current={active ? "step" : undefined}
              className={`text-xs ${
                active ? "font-semibold text-ink" : "text-faint"
              }`}
            >
              {STATUS_LABELS[step]}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className="hidden h-px w-6 bg-line sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
