import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const defaultUsers = [
  { username: "consultant1", password: "1234", role: "Consultant", status: "Approved" },
  { username: "champion1", password: "1234", role: "KnowledgeChampion", status: "Approved" },
  { username: "admin1", password: "1234", role: "Admin", status: "Approved" },
];

const defaultSettings = {
  metadataRequired: true,
  onlyValidatedVisible: false,
  enableGamification: true,
};

const loadUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("dknUsers"));
    if (Array.isArray(stored) && stored.length) {
      return stored.map((entry) => ({
        status: entry.status || "Approved",
        ...entry,
      }));
    }
  } catch {
    // Ignore malformed storage.
  }
  localStorage.setItem("dknUsers", JSON.stringify(defaultUsers));
  return defaultUsers;
};

const loadSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("dknSettings"));
    if (stored) return stored;
  } catch {
    // Ignore malformed storage.
  }
  localStorage.setItem("dknSettings", JSON.stringify(defaultSettings));
  return defaultSettings;
};

export default function Admin() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [users, setUsers] = useState(() => loadUsers());
  const [settings, setSettings] = useState(() => loadSettings());
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "Consultant" });
  const [error, setError] = useState("");
  const pendingUsers = users.filter((entry) => entry.status === "Pending");

  useEffect(() => {
    localStorage.setItem("dknUsers", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("dknSettings", JSON.stringify(settings));
  }, [settings]);

  const addUser = () => {
    setError("");
    const username = newUser.username.trim();
    const password = newUser.password.trim();

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    if (users.some((entry) => entry.username === username)) {
      setError("Username already exists.");
      return;
    }

    setUsers((prev) => [...prev, { username, password, role: newUser.role, status: "Approved" }]);
    setNewUser({ username: "", password: "", role: "Consultant" });
  };

  const updateUser = (index, field, value) => {
    setUsers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const deleteUser = (index) => {
    setUsers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const approveUser = (index) => {
    setUsers((prev) => {
      const next = [...prev];
      const requestedRole = next[index].requestedRole || next[index].role;
      next[index] = {
        ...next[index],
        role: requestedRole,
        status: "Approved",
      };
      return next;
    });
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel">
          <div className="page-card">
            <div className="page-card__header">
              <div>
                <h2>Admin Panel</h2>
                <p className="muted">RBAC management and system settings.</p>
              </div>
            </div>

            <div className="admin-grid">
              <div className="admin-card">
                <h3>Manage Users</h3>
                <p className="muted">Add, edit, or delete users (stored locally).</p>

                <div className="page-form">
                  <input
                    className="page-input"
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                  />
                  <input
                    className="page-input"
                    type="password"
                    placeholder="Temporary password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <select
                    className="page-input"
                    value={newUser.role}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="Consultant">Consultant</option>
                    <option value="KnowledgeChampion">Knowledge Champion</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button className="btn btn--primary" type="button" onClick={addUser}>
                    Add user
                  </button>
                  {error && <p className="muted">{error}</p>}
                </div>

                {pendingUsers.length > 0 && (
                  <div className="home-empty">
                    <strong>Pending approvals</strong>
                    <p className="muted">Review and approve new account requests.</p>
                  </div>
                )}

                <div className="admin-table">
                  {users.map((entry, index) => (
                    <div className="admin-row" key={`${entry.username}-${index}`}>
                      <div className="admin-row__fields">
                        <input
                          className="page-input"
                          type="text"
                          value={entry.username}
                          onChange={(e) => updateUser(index, "username", e.target.value)}
                        />
                        <select
                          className="page-input"
                          value={entry.role}
                          onChange={(e) => updateUser(index, "role", e.target.value)}
                        >
                          <option value="Consultant">Consultant</option>
                          <option value="KnowledgeChampion">Knowledge Champion</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div className="admin-row__meta">
                        <div className="admin-request">
                          <span className="muted">Requested</span>
                          <div className="badge badge--soft">{entry.requestedRole || entry.role}</div>
                        </div>
                        <span className={`badge ${entry.status === "Approved" ? "badge--soft" : ""}`}>
                          {entry.status || "Pending"}
                        </span>
                        {entry.status !== "Approved" ? (
                          <button className="btn btn--primary" type="button" onClick={() => approveUser(index)}>
                            Approve
                          </button>
                        ) : (
                          <button className="btn btn--ghost" type="button" onClick={() => deleteUser(index)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card">
                <h3>System Settings</h3>
                <p className="muted">Toggle global policies.</p>
                <div>
                  <div className="toggle-row">
                    <span>Metadata required</span>
                    <input
                      type="checkbox"
                      checked={settings.metadataRequired}
                      onChange={(e) => setSettings((prev) => ({ ...prev, metadataRequired: e.target.checked }))}
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Only validated visible</span>
                    <input
                      type="checkbox"
                      checked={settings.onlyValidatedVisible}
                      onChange={(e) => setSettings((prev) => ({ ...prev, onlyValidatedVisible: e.target.checked }))}
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Enable gamification</span>
                    <input
                      type="checkbox"
                      checked={settings.enableGamification}
                      onChange={(e) => setSettings((prev) => ({ ...prev, enableGamification: e.target.checked }))}
                    />
                  </div>
                </div>

                <div className="profile-meta" style={{ marginTop: "18px" }}>
                  <div>
                    <span className="profile-meta__label">Admin user</span>
                    <span className="profile-meta__value">{user.username || "admin1"}</span>
                  </div>
                  <div>
                    <span className="profile-meta__label">Role</span>
                    <span className="profile-meta__value">{user.role || "Admin"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
