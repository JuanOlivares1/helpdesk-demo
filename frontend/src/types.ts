export type Role = "admin" | "agent" | "client";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export interface User {
  id: number;
  email: string;
  role: Role;
  created_at: string;
}

export type Assignee = Pick<User, "id" | "email" | "role">;

export interface UserCreatePayload {
  email: string;
  password: string;
  role: Role;
}

export interface UserRoleUpdatePayload {
  role: Role;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  user_id: number;
  assignee_id: number | null;
  created_at: string;
}

export interface Comment {
  id: number;
  body: string;
  ticket_id: number;
  author_id: number;
  created_at: string;
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  page: number;
  pages: number;
}

export interface TicketUpdatePayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee_id?: number | null;
}
