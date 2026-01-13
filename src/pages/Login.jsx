import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const seedUsers = () => {
  const defaults = [
    { username: "consultant1", password: "1234", role: "Consultant", status: "Approved" },
    { username: "champion1", password: "1234", role: "KnowledgeChampion", status: "Approved" },
    { username: "admin1", password: "1234", role: "Admin", status: "Approved" },
  ];

  try {
    const stored = JSON.parse(localStorage.getItem("dknUsers"));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    // Ignore malformed storage.
  }

  localStorage.setItem("dknUsers", JSON.stringify(defaults));
  return defaults;
};

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = () => {
    setError("");
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError("Enter both username and password.");
      return;
    }

    const users = seedUsers();
    const match = users.find(
      (entry) => entry.username === trimmedUser && entry.password === trimmedPass
    );

    if (!match) {
      setError("Invalid username or password.");
      return;
    }

    if (match.status && match.status !== "Approved") {
      setError("Account pending admin approval.");
      return;
    }

    localStorage.setItem("user", JSON.stringify({ username: match.username, role: match.role }));
    navigate("/");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <img className="login-card__logo" src="/images/velion-logo.png" alt="Velion Dynamics" />
          <div className="login-card__title">Velion Dynamics DKN</div>
        </div>

        <div className="login-card__badge" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M12 15v2" />
          </svg>
        </div>

        <h2 className="login-card__heading">Sign in</h2>

        <div className="login-form">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="login-actions">
            <label className="login-remember">
              <input type="checkbox" />
              Remember me
            </label>
            <span className="muted">Demo: consultant1 / 1234</span>
          </div>

          <button className="login-submit" onClick={login} type="button">SIGN IN</button>
          <p id="error" className="login-error">{error}</p>
        </div>

        <div className="login-links">
          <span>
            New to DKN? <Link to="/signup">Create an account</Link>
          </span>
          <Link to="/">Return home</Link>
        </div>
      </div>
      <div className="login-footer">Copyright Ac Velion Dynamics 2026.</div>
    </div>
  );
}
