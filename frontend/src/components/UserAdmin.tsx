import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getApiError, usersApi } from "../api";
import { useAuth } from "../auth/useAuth";
import { formatDate } from "../lib/format";
import type { Role, User } from "../types";
import Alert from "./Alert";
import NewUserDialog from "./NewUserDialog";

const ROLE_OPTIONS: Role[] = ["client", "agent", "admin"];

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  agent: "Agent",
  client: "Client",
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  admin: "bg-accent/10 text-accent-ink ring-accent/20",
  agent: "bg-warning/10 text-warning ring-warning/20",
  client: "bg-ink/5 text-muted ring-line",
};

export default function UserAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, Role>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [successMessages, setSuccessMessages] = useState<Record<number, string>>(
    {},
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user: currentUser } = useAuth();
  const showForm = searchParams.get("new") === "1";

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setError("");
      setLoading(true);

      try {
        const response = await usersApi.list();
        if (!cancelled) {
          setUsers(response.data.users);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err, "Failed to fetch users"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const openForm = () => {
    const next = new URLSearchParams(searchParams);
    next.set("new", "1");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  };

  const handleCreated = () => {
    closeForm();
    setRefreshKey((key) => key + 1);
  };

  const handleRoleChange = (id: number, role: Role) => {
    setRoleDrafts((current) => ({ ...current, [id]: role }));
    setRowErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setSuccessMessages((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const handleSave = async (target: User) => {
    const role = roleDrafts[target.id] ?? target.role;
    if (role === target.role) return;

    setSavingId(target.id);
    setRowErrors((current) => {
      const next = { ...current };
      delete next[target.id];
      return next;
    });
    setSuccessMessages((current) => {
      const next = { ...current };
      delete next[target.id];
      return next;
    });

    try {
      const response = await usersApi.updateRole(target.id, { role });
      setUsers((current) =>
        current.map((user) =>
          user.id === target.id ? response.data.user : user,
        ),
      );
      setRoleDrafts((current) => {
        const next = { ...current };
        delete next[target.id];
        return next;
      });
      setSuccessMessages((current) => ({
        ...current,
        [target.id]: "Access updated.",
      }));
    } catch (err) {
      setRowErrors((current) => ({
        ...current,
        [target.id]: getApiError(err, "Failed to update access"),
      }));
    } finally {
      setSavingId(null);
    }
  };

  const elevatedCount = users.filter((user) => user.role !== "client").length;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} accounts. {elevatedCount} with elevated access.
          </p>
        </div>
        <button type="button" onClick={openForm} className="btn btn-primary">
          New user
        </button>
      </header>

      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="panel mt-5 px-6 py-14 text-center text-sm text-muted"
        >
          Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="panel mt-5 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-ink">No users yet</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Add an account to give someone access to this helpdesk.
          </p>
          <button
            type="button"
            onClick={openForm}
            className="btn btn-secondary mt-2"
          >
            New user
          </button>
        </div>
      ) : (
        <section aria-label="User directory" className="panel mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[640px]">
              <caption className="sr-only">Accounts and access levels</caption>
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Access</th>
                  <th scope="col">Created</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const draft = roleDrafts[user.id] ?? user.role;
                  const rowError = rowErrors[user.id];
                  const rowSuccess = successMessages[user.id];

                  return (
                    <tr key={user.id}>
                      <td className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs tabular-nums text-muted">
                            #{user.id}
                          </span>
                          <span className="truncate font-medium text-ink">
                            {user.email}
                          </span>
                          {isSelf && (
                            <span className="badge bg-accent/10 text-accent-ink ring-accent/20">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`badge ${ROLE_BADGE_CLASS[user.role]}`}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                          <select
                            aria-label={`Role for ${user.email}`}
                            className="input w-auto py-1 text-xs"
                            value={draft}
                            disabled={isSelf}
                            onChange={(event) =>
                              handleRoleChange(
                                user.id,
                                event.target.value as Role,
                              )
                            }
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        </div>
                        {rowError && (
                          <p
                            role="alert"
                            className="mt-1 max-w-xs text-xs font-medium text-critical"
                          >
                            {rowError}
                          </p>
                        )}
                        {rowSuccess && (
                          <p
                            aria-live="polite"
                            className="mt-1 text-xs font-medium text-success"
                          >
                            {rowSuccess}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs tabular-nums text-muted">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="whitespace-nowrap">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={
                            isSelf || draft === user.role || savingId === user.id
                          }
                          onClick={() => void handleSave(user)}
                        >
                          {savingId === user.id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <NewUserDialog
        open={showForm}
        onClose={closeForm}
        onSuccess={handleCreated}
      />
    </main>
  );
}
