import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

function Navbar() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <nav className="navbar">
        <span className="link">Loading...</span>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="left">
        <Link to="/" className="brand">CodeEditor 🚀</Link>
      </div>

      {/* Hamburger Button */}
      <button
        className={`hamburgerBtn ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Links */}
      <div className={`right ${menuOpen ? "open" : ""}`}>
        {!user && (
          <>
            <Link to="/register" className="link" onClick={() => setMenuOpen(false)}>Register</Link>
            <Link to="/login" className="link" onClick={() => setMenuOpen(false)}>Login</Link>
          </>
        )}

        {user && (
          <>
            <Link to="/projects" className="link" onClick={() => setMenuOpen(false)}>Projects</Link>
            <Link to="/editor" className="link" onClick={() => setMenuOpen(false)}>Editor</Link>
            <Link to="/friends" className="link" onClick={() => setMenuOpen(false)}>Friends</Link>
            <Link to="/collab" className="link" onClick={() => setMenuOpen(false)}>Collab Room</Link>

            {user.role_id === 2 && (
              <Link to="/admin" className="link" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
            )}
            {user.role === "admin" && (
              <Link to="/admin" className="link" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
            )}

            <Link to="/profile" className="link" onClick={() => setMenuOpen(false)}>Profile</Link>

            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="logoutBtn"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
