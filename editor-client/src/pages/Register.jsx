import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form.username, form.email, form.password);
      navigate("/editor"); // redirect after register
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Left side branding */}
      <div style={styles.leftPane}>
        <h1 style={styles.brandTitle}>CodeEditor 🚀</h1>
        <p style={styles.brandSubtitle}>
          Join thousands of developers collaborating in real-time.
        </p>
        <img
          src="https://illustrations.popsy.co/gray/startup.svg"
          alt="Team Illustration"
          style={styles.illustration}
        />
      </div>

      {/* Right side form */}
      <div style={styles.rightPane}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create an Account</h2>
          <p style={styles.subtitle}>Start coding, collaborating & deploying</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.button}>
              Register
            </button>
          </form>

          <p style={styles.text}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  leftPane: {
    flex: 1,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    textAlign: "center",
  },
  brandTitle: {
    fontSize: "2.5rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
  },
  brandSubtitle: {
    fontSize: "1.1rem",
    maxWidth: "350px",
    opacity: 0.9,
    marginBottom: "2rem",
  },
  illustration: {
    width: "70%",
    maxWidth: "400px",
  },
  rightPane: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f9fafc",
    padding: "2rem",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
    width: "100%",
    maxWidth: "400px",
    animation: "fadeIn 0.7s ease",
  },
  title: {
    marginBottom: "0.25rem",
    textAlign: "center",
    color: "#222",
    fontWeight: "700",
    fontSize: "1.8rem",
  },
  subtitle: {
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#555",
    fontSize: "0.95rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.9rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  button: {
    padding: "0.9rem",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(90deg, #667eea, #764ba2)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  text: {
    marginTop: "1.2rem",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#555",
  },
  link: {
    color: "#667eea",
    textDecoration: "none",
    fontWeight: "600",
  },
  error: {
    color: "red",
    fontSize: "0.9rem",
    textAlign: "center",
  },
};
