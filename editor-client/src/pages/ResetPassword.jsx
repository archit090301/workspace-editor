import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await api.post(`/reset-password/${token}`, { password });
      setMsg(res.data.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMsg(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Set a new password</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password" placeholder="New password (min 6 chars)"
            value={password} onChange={(e) => setPassword(e.target.value)} required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Update password</button>
        </form>
        {msg && <p style={styles.text}>{msg}</p>}
      </div>
    </div>
  );
}

const styles = {
  container:{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"linear-gradient(135deg,#4e54c8,#8f94fb)"},
  card:{background:"#fff",padding:"2rem",borderRadius:"12px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",width:"100%",maxWidth:"400px"},
  title:{marginBottom:"1.5rem",textAlign:"center",color:"#333"},
  form:{display:"flex",flexDirection:"column",gap:"1rem"},
  input:{padding:"0.8rem",borderRadius:"6px",border:"1px solid #ccc",fontSize:"1rem"},
  button:{padding:"0.8rem",borderRadius:"6px",border:"none",background:"#4e54c8",color:"#fff",fontWeight:"bold",cursor:"pointer"},
  text:{marginTop:"1rem",textAlign:"center"}
};
