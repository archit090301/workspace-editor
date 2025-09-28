import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { useAuth } from "../AuthContext";

export default function CollabLobby() {
  const [roomId, setRoomId] = useState("");
  const [msg, setMsg] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const createRoom = () => {
    socket.emit("collab:create_room", null, ({ roomId }) => {
      setMsg(`🎉 Room created: ${roomId}`);
      navigate(`/collab/${roomId}`);
    });
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) return setMsg("⚠️ Please enter a room code.");
    navigate(`/collab/${roomId.trim()}`);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>🧑‍🤝‍🧑 Collaborative Rooms</h2>
        <p style={styles.subtitle}>
          Create a new room or join an existing one using a code.
        </p>

        {msg && <p style={styles.message}>{msg}</p>}

        <div style={styles.actions}>
          <button onClick={createRoom} style={styles.btnPrimary}>
            🚀 Create Room
          </button>

          <form onSubmit={joinRoom} style={styles.joinForm}>
            <input
              placeholder="Enter room code..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.btnSecondary}>
              🔑 Join
            </button>
          </form>
        </div>

        <p style={styles.footer}>
          Signed in as <b>{user?.username}</b>
        </p>
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
    background: "linear-gradient(135deg,#667eea,#764ba2,#6B8DD6,#8E37D7)",
    padding: "2rem",
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    animation: "fadeIn 0.5s ease",
  },
  title: {
    fontSize: "1.6rem",
    marginBottom: "0.5rem",
    color: "#333",
  },
  subtitle: {
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
    color: "#555",
  },
  message: {
    marginBottom: "1rem",
    fontWeight: "500",
    color: "#444",
    background: "#f1f1f1",
    padding: "0.5rem 0.8rem",
    borderRadius: "8px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  joinForm: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    padding: "0.7rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "0.95rem",
  },
  btnPrimary: {
    padding: "0.7rem 1rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#fff",
    cursor: "pointer",
    background: "linear-gradient(90deg,#43e97b,#38f9d7)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  btnSecondary: {
    padding: "0.7rem 1rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#fff",
    cursor: "pointer",
    background: "linear-gradient(90deg,#667eea,#764ba2)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  footer: {
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: "#555",
  },
};

// ✨ Hover effects via JS injection
for (let btn of [styles.btnPrimary, styles.btnSecondary]) {
  btn.onMouseOver = { transform: "scale(1.05)", boxShadow: "0 6px 16px rgba(0,0,0,0.2)" };
  btn.onMouseOut = { transform: "scale(1)", boxShadow: "none" };
}
