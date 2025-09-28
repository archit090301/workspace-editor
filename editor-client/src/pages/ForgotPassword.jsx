import { useState } from "react";
import api from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setLink("");
    try {
      const res = await api.post("/request-password-reset", { email });
      setMsg(res.data.message || "If the email exists, a reset link has been sent.");
      if (res.data.resetLink) setLink(res.data.resetLink); // dev convenience
    } catch (err) {
      setMsg(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Forgot Password</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Send reset link</button>
        </form>

        {/* Always show user-friendly message */}
        {msg && <p style={styles.text}>{msg}</p>}

        {/* Show reset link only in development */}
        {process.env.NODE_ENV === "development" && link && (
          <p style={{ fontSize: "0.8rem", color: "gray", marginTop: "0.5rem", textAlign: "center" }}>
            Dev link: <a href={link}>{link}</a>
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex", justifyContent: "center", alignItems: "center",
    minHeight: "100vh", background: "linear-gradient(135deg,#4e54c8,#8f94fb)"
  },
  card: {
    background: "#fff", padding: "2rem", borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px"
  },
  title: { marginBottom: "1.5rem", textAlign: "center", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: {
    padding: "0.8rem", borderRadius: "6px",
    border: "1px solid #ccc", fontSize: "1rem"
  },
  button: {
    padding: "0.8rem", borderRadius: "6px", border: "none",
    background: "#4e54c8", color: "#fff", fontWeight: "bold",
    cursor: "pointer", transition: "0.2s"
  },
  text: { marginTop: "1rem", textAlign: "center" }
};
