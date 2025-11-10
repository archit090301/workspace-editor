import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function InvitePopup() {
  const [invite, setInvite] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("collab:invite", (data) => {
      setInvite(data);
    });

    return () => socket.off("collab:invite");
  }, []);

  const handleJoin = () => {
    if (!invite?.roomId) return;
    setInvite(null);
    navigate(`/collab/${invite.roomId}`);
  };

  const handleDismiss = () => setInvite(null);

  if (!invite) return null;

  return (
    <div style={overlay}>
      <div style={popup}>
        <h3 style={{ marginTop: 0, color: "#333" }}>📨 Collaboration Invite</h3>
        <p style={{ margin: "0.5rem 0", color: "#444" }}>
          <strong>{invite.fromUser}</strong> invited you to join a collab room.
        </p>
        <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
          Room ID: <code>{invite.roomId}</code>
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: "1rem" }}>
          <button onClick={handleJoin} style={btnPrimary}>
            Join Room 🚀
          </button>
          <button onClick={handleDismiss} style={btnSecondary}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  bottom: 30,
  right: 30,
  zIndex: 2000,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-end",
};

const popup = {
  background: "#fff",
  padding: "1.2rem 1.5rem",
  borderRadius: 12,
  boxShadow: "0 5px 15px rgba(0,0,0,0.25)",
  maxWidth: 300,
  textAlign: "center",
  animation: "fadeIn 0.3s ease-in-out",
};

const btnPrimary = {
  background: "#4e54c8",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0.6rem 1rem",
  cursor: "pointer",
};

const btnSecondary = {
  background: "#ccc",
  color: "#000",
  border: "none",
  borderRadius: 8,
  padding: "0.6rem 1rem",
  cursor: "pointer",
};
