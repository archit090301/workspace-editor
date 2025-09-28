import { useAuth } from "../AuthContext";
import { useState } from "react";
import api from "../api";

export default function Profile() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(user?.preferred_theme_id === 2 ? "dark" : "light");
  const [status, setStatus] = useState("");

  const handleThemeChange = async (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    setStatus("Saving...");
    try {
      await api.put("/theme", { theme: newTheme });
      setStatus("✅ Theme updated");
    } catch (err) {
      setStatus("❌ Failed to update theme");
    }
  };

  if (!user) return <p style={styles.profileMessage}>⚠️ Please log in</p>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>👤 Profile</h2>

        <div style={styles.info}>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <div style={styles.themeRow}>
          <label htmlFor="themeSelect" style={styles.label}>🎨 Theme:</label>
          <select
            id="themeSelect"
            value={theme}
            onChange={handleThemeChange}
            style={styles.select}
          >
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </div>

        {status && <p style={styles.status}>{status}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "2rem 3rem",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
    animation: "fadeIn 0.4s ease", // won’t work inline, but kept for clarity
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: "#333",
  },
  info: {
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
    color: "#444",
  },
  themeRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  label: {
    fontSize: "1rem",
    fontWeight: "500",
  },
  select: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    background: "#f9fafb",
    cursor: "pointer",
    transition: "0.2s",
  },
  status: {
    marginTop: "1.5rem",
    fontWeight: "500",
    color: "#333",
  },
  profileMessage: {
    textAlign: "center",
    marginTop: "5rem",
    fontSize: "1.2rem",
    color: "#444",
  },
};
