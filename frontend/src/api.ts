import axios from "axios";
import type {
  Comment,
  PaginatedTickets,
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketUpdatePayload,
  User,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = Boolean(
      error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register")
    );

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      localStorage.getItem("token")
    ) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

interface ApiErrorBody {
  error?: string;
  errors?: Record<string, unknown>;
}

function formatFieldErrors(errors: Record<string, unknown>): string {
  return Object.entries(errors)
    .map(([field, value]) => {
      if (Array.isArray(value)) {
        return `${field}: ${value.join(", ")}`;
      }
      if (typeof value === "string") {
        return `${field}: ${value}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("; ");
}

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (data?.error) {
      return data.error;
    }

    if (data?.errors) {
      const message = formatFieldErrors(data.errors);
      if (message) {
        return message;
      }
    }
  }

  return fallback;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
  user: User;
}

interface UserResponse {
  user: User;
}

interface TicketResponse {
  message: string;
  ticket: Ticket;
}

interface CommentResponse {
  message: string;
  comment: Comment;
}

interface CommentsResponse {
  comments: Comment[];
}

export const authApi = {
  register: (email: string, password: string) =>
    api.post<RegisterResponse>("/auth/register", { email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  getMe: () => api.get<UserResponse>("/auth/me"),
};

export const ticketApi = {
  create: (title: string, description: string, priority: TicketPriority) =>
    api.post<TicketResponse>("/tickets/", { title, description, priority }),

  list: (page = 1, perPage = 10, status?: TicketStatus) => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (status) params.append("status", status);
    return api.get<PaginatedTickets>(`/tickets/?${params.toString()}`);
  },

  get: (id: number) => api.get<TicketResponse>(`/tickets/${id}`),

  update: (id: number, data: TicketUpdatePayload) =>
    api.patch<TicketResponse>(`/tickets/${id}`, data),

  addComment: (ticketId: number, body: string) =>
    api.post<CommentResponse>(`/tickets/${ticketId}/comments`, { body }),

  getComments: (ticketId: number) =>
    api.get<CommentsResponse>(`/tickets/${ticketId}/comments`),
};

export default api;
