import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const quickLinks = [
  {
    id: "submit",
    label: "Submit",
    description: "Capture new knowledge submissions.",
    path: "/submit",
    roles: ["Consultant"],
  },
  {
    id: "search",
    label: "Search",
    description: "Find validated knowledge across the repo.",
    path: "/search",
  },
  {
    id: "validate",
    label: "Validate",
    description: "Review and approve submissions.",
    path: "/validate",
    roles: ["KnowledgeChampion"],
  },
  {
    id: "recommendations",
    label: "Recommendations",
    description: "Curated content and experts for you.",
    path: "/recommendations",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "See top contributors and points.",
    path: "/leaderboard",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Manage users and system settings.",
    path: "/admin",
    roles: ["Admin"],
  },
];

const loadStoredUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("dknUsers"));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const loadStoredSettings = () => {
  try {
    return JSON.parse(localStorage.getItem("dknSettings")) || {};
  } catch {
    return {};
  }
};

export default function Home() {
  const navigate = useNavigate();
  const [knowledge, setKnowledge] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [role, setRole] = useState(user?.role || "Consultant");
  const [roleNotice, setRoleNotice] = useState("");

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${apiBase}/api/knowledge`);
      const data = await res.json();
      setKnowledge(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")));
  }, []);

  useEffect(() => {
    setRole(user?.role || "Consultant");
  }, [user]);

  const stats = useMemo(() => {
    const total = knowledge.length;
    const pending = knowledge.filter((item) => ["Pending", "Pending Validation"].includes(item.status)).length;
    const approved = knowledge.filter((item) => item.status === "Approved").length;
    const rejected = knowledge.filter((item) => item.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [knowledge]);

  const mySubmissions = useMemo(() => {
    if (!user) return [];
    return knowledge.filter((item) => item.author === user.username);
  }, [knowledge, user]);

  const usersCount = loadStoredUsers().filter((entry) => entry.status === "Approved").length;
  const settings = loadStoredSettings();

  const applyRole = () => {
    if (!user) return;
    const nextUser = { ...user, role };
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    setRoleNotice(`Role updated to ${role}.`);
    setTimeout(() => setRoleNotice(""), 2500);
  };

  const dashboardWidgets = useMemo(() => {
    if (!role) return [];
    if (role === "KnowledgeChampion") {
      return [
        {
          title: "Validation Queue",
          value: `${stats.pending} pending items`,
          meta: "SLA target: 48 hours",
          action: "Review",
          path: "/validate",
        },
        {
          title: "Flagged Items",
          value: "2 high priority flags",
          meta: "Compliance review needed",
          action: "Inspect",
          path: "/validate",
        },
      ];
    }
    if (role === "Admin") {
      return [
        {
          title: "User Management",
          value: `${usersCount} active users`,
          meta: "RBAC assignments",
          action: "Manage",
          path: "/admin",
        },
        {
          title: "System Settings",
          value: settings?.metadataRequired ? "Metadata required" : "Metadata optional",
          meta: "Visibility & gamification",
          action: "Configure",
          path: "/admin",
        },
      ];
    }
    return [
      {
        title: "Submit",
        value: "Start a new contribution",
        meta: "Metadata required",
        action: "Submit",
        path: "/submit",
      },
      {
        title: "My Submissions",
        value: `${mySubmissions.length} items`,
        meta: `${mySubmissions.filter((item) => item.status === "Approved").length} approved`,
        action: "View",
        path: "/search",
      },
      {
        title: "Recommended for you",
        value: "3 new items",
        meta: "Based on your tags",
        action: "Open",
        path: "/recommendations",
      },
    ];
  }, [role, stats.pending, usersCount, settings, mySubmissions]);

  return (
    <div className="home-shell">
      <Sidebar />
      <main className="home-main">
        <section className="home-panel">
          <div className="home-hero">
            <div className="home-hero__content">
              <span className="eyebrow">Velion Dynamics DKN</span>
              <h1>Home</h1>
              <p>
                The Dynamics Knowledge Network (DKN) is a single workspace to submit, validate,
                and discover verified knowledge across teams.
              </p>
              <div className="home-cta">
                {user ? (
                  <div className="home-welcome">
                    <span>Welcome back, {user.username}.</span>
                    <span className="badge">Role: {user.role}</span>
                  </div>
                ) : (
                  <>
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => navigate("/signup")}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="home-hero__panel">
              <div className="stat-stack">
                <div className="stat-tile">
                  <span>Total Knowledge</span>
                  <strong>{stats.total}</strong>
                </div>
                <div className="stat-tile">
                  <span>Pending Validation</span>
                  <strong>{stats.pending}</strong>
                </div>
                <div className="stat-tile">
                  <span>Approved</span>
                  <strong>{stats.approved}</strong>
                </div>
                <div className="stat-tile">
                  <span>Rejected</span>
                  <strong>{stats.rejected}</strong>
                </div>
              </div>
              <div className="stat-footer">
                Updated {lastUpdated || "--:--:--"}
                <button className="chip chip--button" type="button" onClick={loadDashboard}>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="home-section">
            <div className="home-section__header">
              <h2>Quick Links</h2>
              <p className="muted">Jump into core DKN workflows.</p>
            </div>
            <div className="home-quick-grid">
              {quickLinks.map((item) => {
                const locked = item.roles && (!user || !item.roles.includes(user.role));
                return (
                  <div className="home-quick-card" key={item.id}>
                    <div className="home-quick-card__body">
                      <h3>{item.label}</h3>
                      <p className="muted">{item.description}</p>
                    </div>
                    <div className="home-quick-card__footer">
                      {item.roles && (
                        <span className="badge badge--soft">Role: {item.roles[0]}</span>
                      )}
                      <button
                        className={`btn ${locked ? "btn--ghost" : "btn--primary"}`}
                        type="button"
                        disabled={locked}
                        onClick={() => navigate(item.path)}
                      >
                        {locked ? "Locked" : "Open"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="home-section">
            <div className="home-section__header">
              <h2>Role Selector & Dashboard</h2>
              <p className="muted">Switch roles after login to see role-based widgets.</p>
            </div>
            {user ? (
              <>
                <div className="role-switch">
                  <div>
                    <label htmlFor="roleSelect">Role selector</label>
                    <select
                      id="roleSelect"
                      className="page-input"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Consultant">Consultant</option>
                      <option value="KnowledgeChampion">Knowledge Champion</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="role-switch__actions">
                    <button className="btn btn--primary" type="button" onClick={applyRole}>
                      Apply role
                    </button>
                    <span className="muted">{roleNotice}</span>
                  </div>
                </div>

                <div className="dashboard-grid">
                  {dashboardWidgets.map((widget) => (
                    <div className="dashboard-card" key={widget.title}>
                      <div>
                        <h3>{widget.title}</h3>
                        <p className="dashboard-card__value">{widget.value}</p>
                        <p className="muted">{widget.meta}</p>
                      </div>
                      <button
                        className="btn btn--ghost"
                        type="button"
                        onClick={() => navigate(widget.path)}
                      >
                        {widget.action}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="home-empty">
                <p className="muted">Login to activate the role selector and dashboard widgets.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

