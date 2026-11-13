import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inyectar token automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirigir al login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

interface ApiErrorBody {
  error?: string;
}

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}

export const authApi = {
  register: (email: string, password: string, role = "client") =>
    api.post("/auth/register", { email, password, role }),

  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  getMe: () => api.get("/auth/me"),
};

export const ticketApi = {
  create: (title: string, description: string, priority = "medium") =>
    api.post("/tickets/", { title, description, priority }),

  list: (page = 1, perPage = 10, status?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (status) params.append("status", status);
    return api.get(`/tickets/?${params.toString()}`);
  },

  get: (id: number) => api.get(`/tickets/${id}`),

  update: (
    id: number,
    data: { status?: string; priority?: string; assignee_id?: number }
  ) => api.patch(`/tickets/${id}`, data),

  addComment: (ticketId: number, body: string) =>
    api.post(`/tickets/${ticketId}/comments`, { body }),

  getComments: (ticketId: number) => api.get(`/tickets/${ticketId}/comments`),
};

export default api;
