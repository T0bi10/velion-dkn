import { Navigate } from "react-router-dom";

export default function RoleRoute({ roles, children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
}
