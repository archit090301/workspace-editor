import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { useAuth } from "../AuthContext";

export default function CollabLobby() {
  const [roomId, setRoomId] = useState("");
  const [msg, setMsg] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("recentCollabRooms");
    if (saved) {
      setRecentRooms(JSON.parse(saved));
    }
  }, []);

  const saveToRecentRooms = (roomId) => {
    const updated = [...new Set([roomId, ...recentRooms])].slice(0, 5);
    setRecentRooms(updated);
    localStorage.setItem("recentCollabRooms", JSON.stringify(updated));
  };

  const createRoom = async () => {
    setIsCreating(true);
    setMsg("");
    
    socket.emit("collab:create_room", null, ({ roomId }) => {
      setIsCreating(false);
      if (roomId) {
        setMsg(`🎉 Room created successfully!`);
        saveToRecentRooms(roomId);
        setTimeout(() => navigate(`/collab/${roomId}`), 1000);
      } else {
        setMsg("❌ Failed to create room. Please try again.");
      }
    });
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setMsg("⚠️ Please enter a room code");
      return;
    }
    
    setIsJoining(true);
    setMsg("🔍 Joining room...");
    setTimeout(() => {
      saveToRecentRooms(roomId.trim());
      navigate(`/collab/${roomId.trim()}`);
    }, 500);
  };

  const joinRecentRoom = (recentRoomId) => {
    setRoomId(recentRoomId);
    setMsg("🔍 Joining room...");
    setTimeout(() => navigate(`/collab/${recentRoomId}`), 500);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMsg("📋 Copied to clipboard!");
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div style={styles.wrapper}>
      {/* Animated Background */}
      <div style={styles.background}>
        <div style={styles.bubble1}></div>
        <div style={styles.bubble2}></div>
        <div style={styles.bubble3}></div>
      </div>

      <div style={styles.container}>
        {/* Main Card */}
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>👥</span>
              <span style={styles.logoText}>Collab Spaces</span>
            </div>
            <div style={styles.userBadge}>
              <span style={styles.userIcon}>👋</span>
              {user?.username}
            </div>
          </div>

          <div style={styles.content}>
            <h1 style={styles.title}>Start Collaborating</h1>
            <p style={styles.subtitle}>
              Create a new coding session or join an existing one to collaborate in real-time
            </p>

            {msg && (
              <div style={{
                ...styles.message,
                ...(msg.includes("❌") ? styles.errorMessage : styles.successMessage)
              }}>
                {msg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actions}>
              <button 
                onClick={createRoom} 
                disabled={isCreating}
                style={{
                  ...styles.btnPrimary,
                  ...(isCreating ? styles.btnLoading : {})
                }}
              >
                {isCreating ? (
                  <>
                    <span style={styles.spinner}></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span style={styles.btnIcon}>🚀</span>
                    Create New Room
                  </>
                )}
              </button>

              <div style={styles.divider}>
                <span style={styles.dividerText}>or join existing room</span>
              </div>

              <form onSubmit={joinRoom} style={styles.joinForm}>
                <div style={styles.inputContainer}>
                  <input
                    placeholder="Enter room code..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    style={styles.input}
                    disabled={isJoining}
                  />
                  <button 
                    type="submit" 
                    disabled={isJoining}
                    style={{
                      ...styles.btnSecondary,
                      ...(!roomId.trim() ? styles.btnDisabled : {})
                    }}
                  >
                    {isJoining ? (
                      <span style={styles.spinner}></span>
                    ) : (
                      <span style={styles.btnIcon}>🔑</span>
                    )}
                    Join
                  </button>
                </div>
              </form>
            </div>

            {recentRooms.length > 0 && (
              <div style={styles.recentSection}>
                <h3 style={styles.recentTitle}>Recent Rooms</h3>
                <div style={styles.recentList}>
                  {recentRooms.map((recentRoomId) => (
                    <div
                      key={recentRoomId}
                      style={styles.recentItem}
                      onClick={() => joinRecentRoom(recentRoomId)}
                    >
                      <span style={styles.recentIcon}>📁</span>
                      <span style={styles.recentCode}>{recentRoomId}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(recentRoomId);
                        }}
                        style={styles.copyBtn}
                        title="Copy room code"
                      >
                        📋
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>💬</span>
                <h4>Live Chat</h4>
                <p>Real-time messaging with collaborators</p>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>👨‍💻</span>
                <h4>Multiplayer Editing</h4>
                <p>Code together simultaneously</p>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>⚡</span>
                <h4>Instant Sync</h4>
                <p>Changes sync in milliseconds</p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.tips}>
          <h3 style={styles.tipsTitle}>Quick Tips</h3>
          <ul style={styles.tipsList}>
            <li>Share room code with teammates to collaborate</li>
            <li>Use live chat to discuss changes in real-time</li>
            <li>All code changes are automatically saved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%)",
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
    overflow: "hidden",
    zIndex: 0,
  },
  bubble1: {
    position: "absolute",
    top: "10%",
    left: "10%",
    width: "100px",
    height: "100px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
    animation: "float 6s ease-in-out infinite",
  },
  bubble2: {
    position: "absolute",
    top: "60%",
    right: "10%",
    width: "150px",
    height: "150px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "50%",
    animation: "float 8s ease-in-out infinite",
  },
  bubble3: {
    position: "absolute",
    bottom: "20%",
    left: "20%",
    width: "80px",
    height: "80px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "50%",
    animation: "float 7s ease-in-out infinite",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    maxWidth: "1200px",
    width: "100%",
    zIndex: 1,
    position: "relative",
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1f2937",
  },
  logoIcon: {
    fontSize: "2rem",
  },
  logoText: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(102, 126, 234, 0.1)",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#667eea",
  },
  userIcon: {
    fontSize: "1.1rem",
  },
  content: {
    maxWidth: "500px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "1rem",
    color: "#1f2937",
    lineHeight: "1.2",
  },
  subtitle: {
    fontSize: "1.1rem",
    textAlign: "center",
    color: "#6b7280",
    marginBottom: "2rem",
    lineHeight: "1.6",
  },
  message: {
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    fontWeight: "500",
    textAlign: "center",
    fontSize: "0.95rem",
  },
  successMessage: {
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  btnPrimary: {
    padding: "1rem 2rem",
    borderRadius: "12px",
    border: "none",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  btnSecondary: {
    padding: "0.75rem 1.5rem",
    borderRadius: "10px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    boxShadow: "0 2px 10px rgba(139, 92, 246, 0.3)",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none !important",
    boxShadow: "none !important",
  },
  btnLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  btnIcon: {
    fontSize: "1.2rem",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  divider: {
    position: "relative",
    textAlign: "center",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "1px",
      background: "#e5e7eb",
    },
  },
  dividerText: {
    background: "white",
    padding: "0 1rem",
    color: "#6b7280",
    fontSize: "0.9rem",
    position: "relative",
    zIndex: 1,
  },
  joinForm: {
    width: "100%",
  },
  inputContainer: {
    display: "flex",
    gap: "0.75rem",
    width: "100%",
  },
  input: {
    flex: 1,
    padding: "0.875rem 1.25rem",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.3s ease",
    background: "white",
  },
  recentSection: {
    marginBottom: "2rem",
  },
  recentTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "1rem",
    textAlign: "center",
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    background: "#f8fafc",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #e2e8f0",
  },
  recentIcon: {
    fontSize: "1.1rem",
  },
  recentCode: {
    flex: 1,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "monospace",
  },
  copyBtn: {
    background: "none",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "4px",
    transition: "background 0.2s ease",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  feature: {
    textAlign: "center",
    padding: "1.5rem 1rem",
    background: "rgba(102, 126, 234, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.1)",
  },
  featureIcon: {
    fontSize: "2rem",
    marginBottom: "0.75rem",
    display: "block",
  },
  tips: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "1.5rem",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  },
  tipsTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "1rem",
    textAlign: "center",
  },
  tipsList: {
    color: "#4b5563",
    lineHeight: "1.6",
    paddingLeft: "1.5rem",
  },
};
