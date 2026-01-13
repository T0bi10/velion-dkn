import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

const loadUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("dknUsers"));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export default function AdminRequests() {
  const [users, setUsers] = useState(() => loadUsers());

  const pending = useMemo(
    () => users.filter((entry) => entry.status === "Pending"),
    [users]
  );

  const persist = (next) => {
    setUsers(next);
    localStorage.setItem("dknUsers", JSON.stringify(next));
  };

  const approveUser = (username) => {
    const next = users.map((entry) => {
      if (entry.username !== username) return entry;
      return {
        ...entry,
        role: entry.requestedRole || entry.role,
        status: "Approved",
      };
    });
    persist(next);
  };

  const rejectUser = (username) => {
    const next = users.filter((entry) => entry.username !== username);
    persist(next);
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel">
          <div className="page-card">
            <div className="page-card__header">
              <div>
                <h2>New User Requests</h2>
                <p className="muted">Approve or reject pending account requests.</p>
              </div>
              <span className="badge badge--soft">{pending.length} pending</span>
            </div>

            <div className="admin-requests">
              {pending.map((entry) => (
                <div className="admin-request-card" key={entry.username}>
                  <div>
                    <strong>{entry.username}</strong>
                    <div className="admin-request-meta">
                      <span className="badge">Region: {entry.region || "N/A"}</span>
                      <span className="badge badge--soft">
                        Requested: {entry.requestedRole || entry.role}
                      </span>
                    </div>
                  </div>
                  <div className="admin-request-actions">
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => approveUser(entry.username)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => rejectUser(entry.username)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {pending.length === 0 && (
                <div className="admin-request-empty">
                  No new user requests.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
