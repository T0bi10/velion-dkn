import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function AdminRequests() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const pending = useMemo(
    () => users.filter((entry) => entry.status === "Pending"),
    [users]
  );

  const loadPending = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/requests", {
        headers: { "x-user-role": user?.role || "" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to load requests.");
        return;
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load requests.");
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approveUser = async (username) => {
    setError("");
    try {
      const res = await fetch("/api/admin/requests/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role: user?.role || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to approve user.");
        return;
      }
      loadPending();
    } catch (err) {
      setError("Failed to approve user.");
    }
  };

  const rejectUser = async (username) => {
    setError("");
    try {
      const res = await fetch("/api/admin/requests/reject", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role: user?.role || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to reject user.");
        return;
      }
      loadPending();
    } catch (err) {
      setError("Failed to reject user.");
    }
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
              {error && <p className="muted">{error}</p>}
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
