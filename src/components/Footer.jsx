import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      &copy; 2026 Velion Dynamics | <Link to="/about">About Us</Link>
    </footer>
  );
}
