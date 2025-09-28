import { useState } from "react";
import { useAuth } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/editor");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Left Branding Section */}
      <div style={styles.leftPane}>
        <h1 style={styles.brandTitle}>CodeEditor 🚀</h1>
        <p style={styles.brandSubtitle}>
          Collaborate, Code & Deploy — all in one place.
        </p>
        <img
          src="https://illustrations.popsy.co/gray/laptop.svg"
          alt="Illustration"
          style={styles.illustration}
        />
      </div>

      {/* Right Form Section */}
      <div style={styles.rightPane}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome Back 👋</h2>
          <p style={styles.subtitle}>Log in to continue to your workspace</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.button}>
              Login
            </button>
          </form>

          <div style={styles.footer}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
            <p style={styles.text}>
              Don’t have an account?{" "}
              <Link to="/register" style={styles.link}>
                Register
              </Link>
            </p>
          </div>
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
    color: "#2d2d2d",
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
    transition: "0.2s",
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
  buttonHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
  },
  text: {
    marginTop: "1rem",
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
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
};

export default Login;
