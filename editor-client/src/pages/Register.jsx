import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await register(form.username, form.email, form.password);
      navigate("/editor");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.wrapper} className="register-wrapper">
      {/* Branding Section */}
      <div style={styles.leftPane} className="left-pane">
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>💻</span>
            <h1 style={styles.brandTitle}>CodeEditor</h1>
          </div>
          <p style={styles.brandSubtitle}>
            Join thousands of developers collaborating in real-time.
          </p>
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>👥</span>
              <span>Real-time Collaboration</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🌐</span>
              <span>Instant Deployment</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>⚡</span>
              <span>Lightning Fast</span>
            </div>
          </div>
        </div>
        <img
          src="https://www.svgrepo.com/show/475311/team.svg"
          alt="Team Collaboration"
          style={styles.illustration}
        />
      </div>

      {/* Form Section */}
      <div style={styles.rightPane} className="right-pane">
        <div style={styles.card} className="card">
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>Join CodeEditor</h2>
            <p style={styles.subtitle}>Create your account and start coding</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                style={styles.input}
                disabled={isLoading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                style={styles.input}
                disabled={isLoading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                style={styles.input}
                disabled={isLoading}
              />
              <div style={styles.passwordHint}>
                Use 8+ characters with a mix of letters, numbers & symbols
              </div>
            </div>

            {error && (
              <div style={styles.errorContainer}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.error}>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonLoading : {})
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div style={styles.terms}>
            By creating an account, you agree to our{" "}
            <Link to="/terms" style={styles.termsLink}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" style={styles.termsLink}>
              Privacy Policy
            </Link>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerText}>Already have an account?</span>
          </div>

          <Link to="/login" style={styles.loginLink}>
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    width: "100%",
  },
  leftPane: {
    flex: "1 1 50%",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "3rem 2rem",
    textAlign: "center",
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))",
    position: "relative",
    overflow: "hidden",
  },
  brandContent: {
    maxWidth: "480px",
    width: "100%",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "1.5rem",
  },
  logoIcon: {
    fontSize: "2.5rem",
  },
  brandTitle: {
    fontSize: "2.25rem",
    fontWeight: "800",
    margin: 0,
    background: "linear-gradient(135deg, #fff, #e0e7ff)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  brandSubtitle: {
    fontSize: "1.125rem",
    opacity: 0.9,
    marginBottom: "2.5rem",
    lineHeight: "1.6",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "2rem",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    fontSize: "1rem",
    opacity: 0.9,
    padding: "0.75rem",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },
  featureIcon: {
    fontSize: "1.25rem",
  },
  illustration: {
    width: "100%",
    maxWidth: "400px",
    height: "auto",
    marginTop: "2rem",
    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))",
  },
  rightPane: {
    flex: "1 1 50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: "2rem",
    position: "relative",
  },
  card: {
    background: "#fff",
    padding: "3rem",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)",
    width: "100%",
    maxWidth: "440px",
    animation: "slideUp 0.6s ease-out",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "2.5rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5",
  },
  form: {
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
    fontWeight: "600",
    color: "#374151",
    marginBottom: "0.25rem",
  },
  input: {
    padding: "1rem 1.25rem",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#fff",
  },
  passwordHint: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
  button: {
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "0.5rem",
    position: "relative",
    overflow: "hidden",
  },
  buttonLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid transparent",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 1rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    marginTop: "0.5rem",
  },
  errorIcon: {
    fontSize: "0.875rem",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  terms: {
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "1.5rem",
    lineHeight: "1.4",
  },
  termsLink: {
    color: "#667eea",
    textDecoration: "none",
    fontWeight: "500",
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "2rem 0 1.5rem",
  },
  dividerText: {
    backgroundColor: "#fff",
    padding: "0 1rem",
    fontSize: "0.875rem",
    color: "#64748b",
  },
  loginLink: {
    display: "block",
    textAlign: "center",
    padding: "0.875rem 1.5rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    color: "#374151",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.2s ease",
  },
};

// Add CSS animations
//  
const keyframes = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .register-wrapper {
      flex-direction: column;
    }
    .left-pane {
      padding: 2rem 1.5rem;
      min-height: 40vh;
    }
    .right-pane {
      padding: 2rem 1.5rem;
      min-height: 60vh;
    }
  }

  @media (max-width: 768px) {
    .left-pane {
      padding: 2rem 1rem;
    }
    .right-pane {
      padding: 1.5rem 1rem;
    }
    .card {
      padding: 2rem 1.5rem;
    }
    .brand-title {
      font-size: 2rem;
    }
    .brand-subtitle {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .left-pane {
      padding: 1.5rem 1rem;
    }
    .brand-title {
      font-size: 1.75rem;
    }
    .card {
      padding: 1.5rem 1.25rem;
      border-radius: 20px;
    }
    .title {
      font-size: 1.75rem;
    }
    .features {
      gap: 0.75rem;
    }
    .feature-item {
      font-size: 0.9rem;
      padding: 0.5rem;
    }
  }

  /* Enhanced Interactions */
  .card input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }

  .card button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .card a:hover {
    color: #5a67d8;
  }

  .login-link:hover {
    border-color: #667eea;
    background-color: #f8faff;
    transform: translateY(-1px);
  }

  .terms-link:hover {
    text-decoration: underline;
  }
`;

// Inject styles
const style = document.createElement('style');
style.textContent = keyframes;
document.head.appendChild(style);

