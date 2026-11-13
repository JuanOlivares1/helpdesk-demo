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

export function statusColor(status: TicketStatus): string {
  switch (status) {
    case "open":
      return "#e74c3c";
    case "in_progress":
      return "#f39c12";
    case "resolved":
      return "#2ecc71";
    case "closed":
      return "#7f8c8d";
  }
}
