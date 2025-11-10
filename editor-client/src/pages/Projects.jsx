import { useEffect, useState } from "react";
import { fetchProjects, createProject, deleteProject } from "../apiProjects";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetchProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required");
    if (name.trim().length < 3) return setError("Project name must be at least 3 characters");
    
    setError(""); 
    setBusy(true);
    try {
      const res = await createProject({ 
        project_name: name.trim(), 
        description: desc.trim() || null 
      });
      setProjects(p => [res.data, ...p]);
      setName(""); 
      setDesc("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create project");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (projectId) => {
    const confirmed = window.confirm("Are you sure you want to delete this project? This action cannot be undone.");
    if (!confirmed) return;

    setDeleteLoading(projectId);
    try {
      await deleteProject(projectId);
      setProjects(p => p.filter(pr => pr.project_id !== projectId));
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete project");
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Your Projects</h1>
            <p style={styles.subtitle}>
              Create and manage your coding projects
            </p>
          </div>
          <div style={styles.projectCount}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>

        {/* Create Project Form */}
        <div style={styles.formSection}>
          <h3 style={styles.formTitle}>Create New Project</h3>
          <form onSubmit={handleCreate} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                placeholder="Project name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
              <div style={styles.charCount}>
                {name.length}/50
              </div>
            </div>
            
            <input
              style={styles.input}
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={120}
            />
            
            {error && (
              <div style={styles.errorContainer}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.error}>{error}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={busy || !name.trim()} 
              style={{
                ...styles.button,
                ...((busy || !name.trim()) && styles.buttonDisabled)
              }}
            >
              {busy ? (
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Creating...
                </div>
              ) : (
                "Create Project"
              )}
            </button>
          </form>
        </div>

        {/* Projects List */}
        <div style={styles.projectsSection}>
          <h3 style={styles.sectionTitle}>Your Projects</h3>
          
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📁</div>
              <h3 style={styles.emptyTitle}>No projects yet</h3>
              <p style={styles.emptyText}>
                Create your first project to start coding and collaborating
              </p>
            </div>
          ) : (
            <div style={styles.projectsGrid}>
              {projects.map(project => (
                <div key={project.project_id} style={styles.projectCard}>
                  <div style={styles.projectHeader}>
                    <div style={styles.projectIcon}>💻</div>
                    <div style={styles.projectActions}>
                      <button
                        style={styles.menuButton}
                        onClick={() => {/* Add dropdown menu */}}
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                  
                  <div style={styles.projectContent}>
                    <h4 style={styles.projectName}>{project.project_name}</h4>
                    {project.description && (
                      <p style={styles.projectDescription}>{project.description}</p>
                    )}
                    <div style={styles.projectMeta}>
                      <span style={styles.projectDate}>
                        Created {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.projectFooter}>
                    <button
                      style={styles.openBtn}
                      onClick={() => navigate(`/projects/${project.project_id}`)}
                    >
                      <span>Open Project</span>
                      <span style={styles.buttonIcon}>→</span>
                    </button>
                    <button
                      style={{
                        ...styles.deleteBtn,
                        ...(deleteLoading === project.project_id && styles.deleteBtnLoading)
                      }}
                      onClick={() => handleDelete(project.project_id)}
                      disabled={deleteLoading === project.project_id}
                    >
                      {deleteLoading === project.project_id ? (
                        <div style={styles.spinner}></div>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem 1rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: "1200px",
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
    padding: "2.5rem",
    animation: "slideUp 0.5s ease-out"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2.5rem",
    flexWrap: "wrap",
    gap: "1rem"
  },
  title: {
    fontSize: "2.25rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    color: "#1e293b",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#64748b",
    margin: 0
  },
  projectCount: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontWeight: "600",
    fontSize: "0.9rem"
  },
  formSection: {
    background: "#f8fafc",
    padding: "2rem",
    borderRadius: "16px",
    marginBottom: "3rem",
    border: "1px solid #e2e8f0"
  },
  formTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 1.5rem 0",
    color: "#1e293b"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  inputGroup: {
    position: "relative"
  },
  input: {
    padding: "1rem 1.25rem",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#fff",
    width: "100%",
    boxSizing: "border-box"
  },
  charCount: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "0.75rem",
    color: "#94a3b8"
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 1rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px"
  },
  errorIcon: {
    fontSize: "0.875rem"
  },
  error: {
    color: "#dc2626",
    fontSize: "0.875rem",
    fontWeight: "500"
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
    alignSelf: "flex-start"
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none !important"
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  projectsSection: {
    marginTop: "2rem"
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    margin: "0 0 1.5rem 0",
    color: "#1e293b"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "3rem",
    color: "#64748b"
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem 2rem",
    color: "#64748b"
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "1rem"
  },
  emptyTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
    color: "#475569"
  },
  emptyText: {
    margin: 0,
    fontSize: "1rem"
  },
  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem"
  },
  projectCard: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "16px",
    padding: "1.5rem",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column"
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem"
  },
  projectIcon: {
    fontSize: "1.5rem"
  },
  menuButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "0.25rem"
  },
  projectContent: {
    flex: 1,
    marginBottom: "1.5rem"
  },
  projectName: {
    fontSize: "1.125rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
    color: "#1e293b"
  },
  projectDescription: {
    fontSize: "0.9rem",
    color: "#64748b",
    margin: "0 0 1rem 0",
    lineHeight: "1.4"
  },
  projectMeta: {
    fontSize: "0.8rem",
    color: "#94a3b8"
  },
  projectFooter: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "auto"
  },
  openBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    border: "1.5px solid #667eea",
    background: "transparent",
    color: "#667eea",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  deleteBtn: {
    padding: "0.75rem 1rem",
    border: "1.5px solid #dc2626",
    background: "transparent",
    color: "#dc2626",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "80px"
  },
  deleteBtnLoading: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  buttonIcon: {
    fontSize: "1.1rem"
  }
};

// Add CSS animations
// const styleSheet = document.styleSheets[0];
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
  @media (max-width: 768px) {
    .card {
      padding: 1.5rem;
      border-radius: 16px;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .title {
      font-size: 1.75rem;
    }
    
    .form-section {
      padding: 1.5rem;
    }
    
    .projects-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .project-card {
      padding: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1rem 0.75rem;
    }
    
    .card {
      padding: 1.25rem;
      border-radius: 12px;
    }
    
    .form-section {
      padding: 1.25rem;
    }
    
    .project-footer {
      flex-direction: column;
    }
    
    .open-btn, .delete-btn {
      width: 100%;
    }
  }

  /* Enhanced Interactions */
  .card input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .card button:not(:disabled):hover {
    transform: translateY(-1px);
  }

  .open-btn:hover {
    background: #667eea;
    color: white;
  }

  .delete-btn:hover {
    background: #dc2626;
    color: white;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #c7d2fe;
  }

  .menu-button:hover {
    background: #f1f5f9;
    border-radius: 4px;
  }
`;

// Inject styles
const style = document.createElement('style');
style.textContent = keyframes;
document.head.appendChild(style);