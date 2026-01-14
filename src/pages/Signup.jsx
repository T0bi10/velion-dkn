import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const roleOptions = [
  "Consultant",
  "KnowledgeChampion",
  "Admin",
];

const regionOptions = ["Americas", "EMEA", "APAC", "Global"];

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("");
  const [requestedRole, setRequestedRole] = useState("Consultant");
  const [error, setError] = useState("");

  const signup = async () => {
    setError("");
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError("Enter both username and password.");
      return;
    }

    if (!region) {
      setError("Select a region.");
      return;
    }

    if (trimmedUser.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (trimmedPass.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass,
          region,
          requestedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Signup failed.");
        return;
      }
      navigate("/login");
    } catch (error) {
      setError("Signup failed.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-card__heading">Create your DKN account</h2>
        <div className="login-form">
          <label htmlFor="signupUsername">Username *</label>
          <input
            type="text"
            id="signupUsername"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="signupPassword">Password *</label>
          <input
            type="password"
            id="signupPassword"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label htmlFor="signupRegion">Region *</label>
          <select
            id="signupRegion"
            className="page-input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">Select region</option>
            {regionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="signupRole">Requested role *</label>
          <select
            id="signupRole"
            className="page-input"
            value={requestedRole}
            onChange={(e) => setRequestedRole(e.target.value)}
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <p className="muted">Roles and access are validated by Admin after signup.</p>
          <button className="login-submit" type="button" onClick={signup}>Create Account</button>
          <p className="login-error">{error}</p>
        </div>
        <div className="login-links">
          <span>
            Already registered? <Link to="/login">Sign in</Link>
          </span>
          <Link to="/">Return home</Link>
        </div>
      </div>
    </div>
  );
}
