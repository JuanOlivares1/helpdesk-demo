import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import Navbar from "./components/Navbar";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import TicketList from "./components/TicketList";
import TicketDetail from "./components/TicketDetail";
import UserAdmin from "./components/UserAdmin";
import NotFound from "./components/NotFound";

function LoadingScreen() {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p role="status" aria-live="polite" className="text-sm text-ink/60">
        Loading…
      </p>
    </main>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return token ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return token ? <Navigate to="/" replace /> : children;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginForm />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterForm />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <TicketList />
            </PrivateRoute>
          }
        />
        <Route
          path="/ticket/:id"
          element={
            <PrivateRoute>
              <TicketDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UserAdmin />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
