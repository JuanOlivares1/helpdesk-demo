import type { TicketPriority, TicketStatus } from "./types";

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  open: "bg-critical/10 text-critical ring-critical/25",
  in_progress: "bg-warning/10 text-warning ring-warning/25",
  resolved: "bg-success/10 text-success ring-success/25",
  closed: "bg-ink/5 text-muted ring-line",
};

export const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  low: "bg-surface-muted text-muted ring-line",
  medium: "bg-accent/10 text-accent-ink ring-accent/20",
  high: "bg-critical/10 text-critical ring-critical/25",
};
