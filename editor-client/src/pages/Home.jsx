import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.title}>Welcome to <span style={styles.highlight}>CodeEditor 🚀</span></h1>
        <p style={styles.subtitle}>
          A simple, modern, and collaborative online code editor.  
          Write, run, and save your projects anywhere.
        </p>
        <div style={styles.cta}>
          <Link to="/register" style={styles.buttonPrimary}>Get Started</Link>
          <Link to="/login" style={styles.buttonSecondary}>Login</Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.featureCard}>
          <h3>⚡ Fast Online Editor</h3>
          <p>Write and run code instantly in multiple languages.</p>
        </div>
        <div style={styles.featureCard}>
          <h3>💾 Save Projects</h3>
          <p>Keep track of your files and versions with ease.</p>
        </div>
        <div style={styles.featureCard}>
          <h3>🤝 Collaborate</h3>
          <p>Work together in real-time with your team.</p>
        </div>
      </section>

      {/* Call to Action */}
      <section style={styles.footerCta}>
        <h2>Ready to start coding?</h2>
        <Link to="/register" style={styles.buttonPrimary}>Join Now</Link>
      </section>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    minHeight: "100vh",
    padding: "2rem",
  },
  hero: {
    textAlign: "center",
    marginTop: "5rem",
    marginBottom: "4rem",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  highlight: {
    color: "#ffd700",
  },
  subtitle: {
    fontSize: "1.3rem",
    maxWidth: "700px",
    margin: "0 auto",
    lineHeight: "1.6",
  },
  cta: {
    marginTop: "2rem",
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  buttonPrimary: {
    background: "#ffd700",
    color: "#333",
    padding: "0.8rem 1.5rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  buttonSecondary: {
    background: "#fff",
    color: "#333",
    padding: "0.8rem 1.5rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    marginBottom: "4rem",
    flexWrap: "wrap",
  },
  featureCard: {
    background: "rgba(255,255,255,0.1)",
    padding: "1.5rem",
    borderRadius: "10px",
    width: "280px",
    textAlign: "center",
  },
  footerCta: {
    textAlign: "center",
    marginTop: "3rem",
  },
};
