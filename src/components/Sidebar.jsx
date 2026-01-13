import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h8v8H3z" />
      <path d="M13 3h8v5h-8z" />
      <path d="M13 10h8v11h-8z" />
      <path d="M3 13h8v8H3z" />
    </svg>
  ),
  submit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 7v10" />
      <path d="M7 12h10" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  validation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  recommendations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l3 6 6 .9-4.5 4.4 1 6.2L12 17l-5.5 3.5 1-6.2L3 9.9 9 9l3-6z" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20c1.5-3 5-5 8-5s6.5 2 8 5" />
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18" />
      <path d="M3 12h18" />
      <path d="M3 19h18" />
      <path d="M8 5v14" />
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v3a5 5 0 0 1-10 0z" />
      <path d="M5 4h2v2a3 3 0 0 1-2-2z" />
      <path d="M17 4h2a3 3 0 0 1-2 2z" />
      <path d="M10 14h4v3h-4z" />
      <path d="M8 20h8" />
    </svg>
  ),
};

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: icons.dashboard, path: "/" },
  { id: "submit", label: "Submit Knowledge", icon: icons.submit, path: "/submit" },
  { id: "search", label: "Search Knowledge", icon: icons.search, path: "/search" },
  { id: "validation", label: "Validation", icon: icons.validation, path: "/validate", roles: ["KnowledgeChampion"] },
  { id: "recommendations", label: "Recommendations", icon: icons.recommendations, path: "/recommendations" },
  { id: "admin", label: "Admin Panel", icon: icons.admin, path: "/admin", roles: ["Admin"] },
  { id: "admin-requests", label: "User Requests", icon: icons.requests, path: "/admin/requests", roles: ["Admin"] },
  { id: "leaderboard", label: "Leaderboard", icon: icons.leaderboard, path: "/leaderboard" },
];

const getActiveId = (pathname) => {
  if (pathname === "/") return "dashboard";
  const match = sidebarItems.find(
    (item) => item.path !== "/" && pathname.startsWith(item.path)
  );
  return match ? match.id : "dashboard";
};

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = getActiveId(location.pathname);
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || null;

  return (
    <aside className={`home-sidebar ${isSidebarOpen ? "is-expanded" : ""}`}>
      <div className="home-sidebar__brand">
        <img
          className="home-sidebar__logo"
          src="/images/velion-logo.png"
          alt="Velion Dynamics"
        />
        <button
          className="home-sidebar__badge"
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-expanded={isSidebarOpen}
          aria-label="Toggle sidebar"
        >
          DKN
        </button>
      </div>
      <nav className="home-sidebar__nav">
        {sidebarItems
          .filter((item) => !item.roles || (role && item.roles.includes(role)))
          .map((item) => (
          <button
            key={item.id}
            className={`home-sidebar__item ${activeId === item.id ? "is-active" : ""}`}
            type="button"
            aria-label={item.label}
            onClick={() => navigate(item.path)}
          >
            <span className="home-sidebar__icon" aria-hidden="true">{item.icon}</span>
            <span className="home-sidebar__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
