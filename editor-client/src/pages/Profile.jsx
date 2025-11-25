import { useAuth } from "../AuthContext";
import { useState, useEffect } from "react";
import api from "../api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [theme, setTheme] = useState(user?.preferred_theme_id === 2 ? "dark" : "light");
  const [status, setStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ username: user?.username || "", email: user?.email || "" });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Apply theme instantly when changed
  useEffect(() => {
    if (user) {
      const newTheme = user.preferred_theme_id === 2 ? "dark" : "light";
      setTheme(newTheme);
      applyTheme(newTheme);
    }
  }, [user]);

  const applyTheme = (theme) => {
    // Apply theme to the entire app
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('preferred-theme', theme);
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme); // Apply instantly
    
    setStatus("🔄 Saving theme...");
    try {
      const themeId = newTheme === "dark" ? 2 : 1;
      await api.put("/theme", { theme: newTheme, theme_id: themeId });
      
      // Update user context with new theme
      if (updateUser) {
        updateUser({ ...user, preferred_theme_id: themeId });
      }
      
      setStatus("✅ Theme updated!");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("Failed to save theme");
      // Revert to previous theme on error
      const previousTheme = user.preferred_theme_id === 2 ? "dark" : "light";
      setTheme(previousTheme);
      applyTheme(previousTheme);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedUser({ username: user.username, email: user.email });
  };

  const handleSaveProfile = async () => {
    setStatus("🔄 Updating profile...");
    try {
      await api.put("/profile", editedUser);
      
      if (updateUser) {
        updateUser({ ...user, ...editedUser });
      }
      
      setIsEditing(false);
      setStatus("✅ Profile updated!");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser({ username: user.username, email: user.email });
  };

  const getJoinDate = () => {
    if (!user?.created_at) return "Unknown";
    return new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorState}>
            <span style={styles.errorIcon}>⚠️</span>
            <h2>Authentication Required</h2>
            <p>Please log in to view your profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Elements */}
      <div style={styles.background}>
        <div style={styles.bubble}></div>
        <div style={styles.bubble}></div>
        <div style={styles.bubble}></div>
      </div>

      <div style={styles.content}>
        {/* Main Profile Card */}
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div style={styles.userInfo}>
                <h1 style={styles.title}>{user.username}</h1>
                <p style={styles.joinDate}>Joined {getJoinDate()}</p>
              </div>
            </div>
            <button 
              onClick={handleEditProfile}
              style={styles.editButton}
              disabled={isEditing}
            >
              ✏️ Edit Profile
            </button>
          </div>

          {/* Status Message */}
          {status && (
            <div style={{
              ...styles.status,
              ...(status.includes("❌") ? styles.errorStatus : styles.successStatus)
            }}>
              {status}
            </div>
          )}

          {/* Profile Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
            
            {isEditing ? (
              <div style={styles.editForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username</label>
                  <input
                    type="text"
                    value={editedUser.username}
                    onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                    style={styles.input}
                    placeholder="Enter username"
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    style={styles.input}
                    placeholder="Enter email"
                  />
                </div>

                <div style={styles.editActions}>
                  <button 
                    onClick={handleSaveProfile}
                    style={styles.saveButton}
                  >
                    💾 Save Changes
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    style={styles.cancelButton}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Username</span>
                  <span style={styles.infoValue}>{user.username}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>{user.email}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>User ID</span>
                  <span style={styles.infoValue}>#{user.user_id}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Role</span>
                  <span style={{
                    ...styles.roleBadge,
                    ...(user.role_id === 2 ? styles.adminBadge : styles.userBadge)
                  }}>
                    {user.role_id === 2 ? "Administrator" : "User"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Theme Preferences */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🎨 Appearance</h3>
            <div style={styles.themeSection}>
              <p style={styles.themeDescription}>
                Choose your preferred theme for the code editor and interface
              </p>
              
              <div style={styles.themeOptions}>
                <div 
                  style={{
                    ...styles.themeOption,
                    ...(theme === "light" ? styles.themeOptionActive : {})
                  }}
                  onClick={() => handleThemeChange("light")}
                >
                  <div style={styles.themePreviewLight}>
                    <div style={styles.themePreviewHeader}></div>
                    <div style={styles.themePreviewContent}>
                      <div style={styles.previewLine}></div>
                      <div style={styles.previewLine}></div>
                      <div style={styles.previewLineShort}></div>
                    </div>
                  </div>
                  <div style={styles.themeInfo}>
                    <span style={styles.themeIcon}>☀️</span>
                    <span style={styles.themeName}>Light</span>
                    {theme === "light" && <span style={styles.activeIndicator}>✓</span>}
                  </div>
                </div>

                <div 
                  style={{
                    ...styles.themeOption,
                    ...(theme === "dark" ? styles.themeOptionActive : {})
                  }}
                  onClick={() => handleThemeChange("dark")}
                >
                  <div style={styles.themePreviewDark}>
                    <div style={styles.themePreviewHeader}></div>
                    <div style={styles.themePreviewContent}>
                      <div style={styles.previewLine}></div>
                      <div style={styles.previewLine}></div>
                      <div style={styles.previewLineShort}></div>
                    </div>
                  </div>
                  <div style={styles.themeInfo}>
                    <span style={styles.themeIcon}>🌙</span>
                    <span style={styles.themeName}>Dark</span>
                    {theme === "dark" && <span style={styles.activeIndicator}>✓</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📊 Quick Stats</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>📁</span>
                <span style={styles.statNumber}>0</span>
                <span style={styles.statLabel}>Projects</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>📝</span>
                <span style={styles.statNumber}>0</span>
                <span style={styles.statLabel}>Files</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>👥</span>
                <span style={styles.statNumber}>0</span>
                <span style={styles.statLabel}>Collabs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Card - Hidden on mobile */}
        {!isMobile && (
          <div style={styles.sideCard}>
            <h3 style={styles.sideCardTitle}>💡 Profile Tips</h3>
            <ul style={styles.tipsList}>
              <li>Your theme preference syncs across all devices</li>
              <li>Keep your email updated for important notifications</li>
              <li>Use a recognizable username for collaborations</li>
              <li>Dark theme reduces eye strain during long coding sessions</li>
            </ul>
            
            <div style={styles.helpSection}>
              <h4>Need Help?</h4>
              <p>Contact support if you need assistance with your account.</p>
              <button style={styles.helpButton}>📧 Contact Support</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "1rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bubble: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.1)",
    animation: "float 6s ease-in-out infinite",
  },
  content: {
    display: "flex",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  card: {
    flex: 1,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "2.5rem",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: "bold",
    color: "white",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
  },
  userInfo: {
    flex: 1,
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#1f2937",
    margin: "0 0 0.25rem 0",
  },
  joinDate: {
    color: "#6b7280",
    fontSize: "0.95rem",
  },
  editButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  status: {
    padding: "1rem 1.5rem",
    borderRadius: "10px",
    marginBottom: "1.5rem",
    fontWeight: "500",
    textAlign: "center",
    fontSize: "0.95rem",
  },
  successStatus: {
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  errorStatus: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  section: {
    marginBottom: "2.5rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "1.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "2px solid #f3f4f6",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  infoLabel: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#1f2937",
  },
  roleBadge: {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.875rem",
    fontWeight: "600",
    textAlign: "center",
    display: "inline-block",
    width: "fit-content",
  },
  adminBadge: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white",
  },
  userBadge: {
    background: "linear-gradient(135deg, #6b7280, #4b5563)",
    color: "white",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    padding: "0.875rem 1rem",
    borderRadius: "8px",
    border: "2px solid #e5e7eb",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.3s ease",
    background: "white",
  },
  editActions: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  saveButton: {
    padding: "0.875rem 1.5rem",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    flex: 1,
  },
  cancelButton: {
    padding: "0.875rem 1.5rem",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    flex: 1,
  },
  themeSection: {
    marginTop: "1rem",
  },
  themeDescription: {
    color: "#6b7280",
    marginBottom: "1.5rem",
    fontSize: "0.95rem",
  },
  themeOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1.5rem",
  },
  themeOption: {
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "white",
  },
  themeOptionActive: {
    borderColor: "#667eea",
    boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
    background: "#f8faff",
  },
  themePreviewLight: {
    height: "80px",
    background: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  themePreviewDark: {
    height: "80px",
    background: "#1f2937",
    borderRadius: "8px",
    border: "1px solid #374151",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  themePreviewHeader: {
    height: "20px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  },
  themePreviewContent: {
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  previewLine: {
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "2px",
  },
  previewLineShort: {
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "2px",
    width: "60%",
  },
  themeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontWeight: "500",
    color: "#374151",
  },
  themeIcon: {
    fontSize: "1.2rem",
  },
  themeName: {
    flex: 1,
  },
  activeIndicator: {
    color: "#667eea",
    fontWeight: "bold",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "1.5rem",
  },
  statItem: {
    textAlign: "center",
    padding: "1.5rem 1rem",
    background: "rgba(102, 126, 234, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.1)",
  },
  statIcon: {
    fontSize: "1.5rem",
    display: "block",
    marginBottom: "0.5rem",
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#667eea",
    display: "block",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginTop: "0.25rem",
  },
  sideCard: {
    width: "300px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "16px",
    padding: "2rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    height: "fit-content",
  },
  sideCardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "1.5rem",
  },
  tipsList: {
    color: "#4b5563",
    lineHeight: "1.6",
    marginBottom: "2rem",
    paddingLeft: "1.25rem",
  },
  helpSection: {
    paddingTop: "1.5rem",
    borderTop: "1px solid #e5e7eb",
  },
  helpButton: {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "1rem",
  },
  errorState: {
    textAlign: "center",
    padding: "3rem 2rem",
    color: "#6b7280",
  },
  errorIcon: {
    fontSize: "3rem",
    display: "block",
    marginBottom: "1rem",
  },
};
