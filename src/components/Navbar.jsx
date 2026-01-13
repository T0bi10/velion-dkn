import { useNavigate } from "react-router-dom";

const loadPendingCount = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("dknUsers"));
    if (!Array.isArray(stored)) return 0;
    return stored.filter((entry) => entry.status === "Pending").length;
  } catch {
    return 0;
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const pendingCount = user?.role === "Admin" ? loadPendingCount() : 0;

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__logo-button"
          type="button"
          onClick={() => navigate("/")}
          aria-label="Go to home"
        >
          <img className="topbar__logo" src="/images/velion-logo.png" alt="Velion Dynamics" />
        </button>
      </div>
      <div className="topbar__center">Velion Dynamics DKN</div>
      <div className="topbar__right">
        {user ? (
          <>
            <span className="topbar__user">{user.username} - {user.role}</span>
            {user.role === "Admin" && (
              <button
                className="topbar__icon-button"
                type="button"
                onClick={() => navigate("/admin/requests")}
                aria-label="User requests"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {pendingCount > 0 && <span className="topbar__badge">{pendingCount}</span>}
              </button>
            )}
            <button className="topbar__button" onClick={logout} type="button">Logout</button>
          </>
        ) : (
          <>
            <button className="topbar__button" onClick={() => navigate("/login")} type="button">Login</button>
            <button className="topbar__button" onClick={() => navigate("/signup")} type="button">Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}
