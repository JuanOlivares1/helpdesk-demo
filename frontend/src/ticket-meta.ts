import type { TicketPriority, TicketStatus } from "./types";

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  open: "bg-red-100 text-red-700 ring-1 ring-red-200",
  in_progress: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  closed: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export const PRIORITY_BADGE_CLASS: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};
