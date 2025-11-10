import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && isMobile && !event.target.closest('.navbar')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen, isMobile]);

  if (loading) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <span className="brand">Loading...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            CodeEditor 🚀
          </Link>
        </div>

        {isMobile && (
          <button
            className={`hamburger-btn ${menuOpen ? "open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <div className={`nav-right ${menuOpen ? "open" : ""} ${isMobile ? "mobile" : ""}`}>
          {!user ? (
            <div className="nav-links">
              <Link to="/register" className="nav-link" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </div>
          ) : (
            <div className="nav-links">
              <Link to="/projects" className="nav-link" onClick={() => setMenuOpen(false)}>
                Projects
              </Link>
              <Link to="/editor" className="nav-link" onClick={() => setMenuOpen(false)}>
                Editor
              </Link>
              <Link to="/friends" className="nav-link" onClick={() => setMenuOpen(false)}>
                Friends
              </Link>
              <Link to="/collab" className="nav-link" onClick={() => setMenuOpen(false)}>
                Collab Room
              </Link>

              {(user.role_id === 2 || user.role === "admin") && (
                <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}

              <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>

              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {isMobile && menuOpen && (
          <div 
            className="mobile-overlay" 
            onClick={() => setMenuOpen(false)}
          ></div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;