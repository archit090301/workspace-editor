import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={isMobile ? styles.mobileTitle : styles.title}>
            Welcome to <span style={styles.highlight}>CodeEditor 🚀</span>
          </h1>
          <p style={isMobile ? styles.mobileSubtitle : styles.subtitle}>
            A simple, modern, and collaborative online code editor.  
            Write, run, and save your projects anywhere.
          </p>
          <div style={isMobile ? styles.mobileCta : styles.cta}>
            <Link to="/register" style={styles.buttonPrimary}>Get Started</Link>
            <Link to="/login" style={styles.buttonSecondary}>Login</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={isMobile ? styles.mobileFeatures : styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Fast Online Editor</h3>
            <p style={styles.featureText}>Write and run code instantly in multiple languages.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💾</div>
            <h3 style={styles.featureTitle}>Save Projects</h3>
            <p style={styles.featureText}>Keep track of your files and versions with ease.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🤝</div>
            <h3 style={styles.featureTitle}>Collaborate</h3>
            <p style={styles.featureText}>Work together in real-time with your team.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={styles.footerCta}>
        <div style={styles.footerContent}>
          <h2 style={isMobile ? styles.mobileFooterTitle : styles.footerTitle}>
            Ready to start coding?
          </h2>
          <Link to="/register" style={styles.buttonPrimary}>Join Now</Link>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Inter', 'Arial', sans-serif",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    minHeight: "100vh",
    padding: "1rem",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    textAlign: "center",
  },
  heroContent: {
    maxWidth: "800px",
    width: "100%",
  },
  title: {
    fontSize: "3.5rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    lineHeight: "1.2",
  },
  mobileTitle: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    lineHeight: "1.2",
    padding: "0 1rem",
  },
  highlight: {
    color: "#ffd700",
    display: "block",
  },
  subtitle: {
    fontSize: "1.5rem",
    maxWidth: "700px",
    margin: "0 auto 2rem",
    lineHeight: "1.6",
    opacity: 0.9,
  },
  mobileSubtitle: {
    fontSize: "1.1rem",
    maxWidth: "700px",
    margin: "0 auto 2rem",
    lineHeight: "1.5",
    opacity: 0.9,
    padding: "0 1rem",
  },
  cta: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  mobileCta: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    alignItems: "center",
    padding: "0 1rem",
  },
  buttonPrimary: {
    background: "#ffd700",
    color: "#333",
    padding: "1rem 2rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: "all 0.3s ease",
    display: "inline-block",
    minWidth: "160px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  buttonSecondary: {
    background: "rgba(255,255,255,0.9)",
    color: "#333",
    padding: "1rem 2rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: "all 0.3s ease",
    display: "inline-block",
    minWidth: "160px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  features: {
    padding: "4rem 1rem",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "20px",
    margin: "2rem 0",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  mobileFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    maxWidth: "400px",
    margin: "0 auto",
  },
  featureCard: {
    background: "rgba(255,255,255,0.1)",
    padding: "2rem",
    borderRadius: "16px",
    textAlign: "center",
    transition: "transform 0.3s ease, background 0.3s ease",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  featureIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  featureTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "#ffd700",
  },
  featureText: {
    fontSize: "1rem",
    lineHeight: "1.6",
    opacity: 0.9,
  },
  footerCta: {
    padding: "3rem 1rem",
    textAlign: "center",
  },
  footerContent: {
    maxWidth: "600px",
    margin: "0 auto",
  },
  footerTitle: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  mobileFooterTitle: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
    lineHeight: "1.3",
  },
};

// Add hover effects for non-touch devices
const hoverStyles = `
  @media (hover: hover) and (pointer: fine) {
    .home-button-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      background: #ffed4a;
    }
    .home-button-secondary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      background: #fff;
    }
    .home-feature-card:hover {
      transform: translateY(-5px);
      background: rgba(255,255,255,0.15);
    }
  }
`;

// Inject hover styles
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(hoverStyles, styleSheet.cssRules.length);
}

// Add the hover classes to the buttons and cards
// const enhancedStyles = {
//   ...styles,
//   buttonPrimary: {
//     ...styles.buttonPrimary,
//     className: 'home-button-primary'
//   },
//   buttonSecondary: {
//     ...styles.buttonSecondary,
//     className: 'home-button-secondary'
//   },
//   featureCard: {
//     ...styles.featureCard,
//     className: 'home-feature-card'
//   }
// };
