import { useEffect, useState } from "react";
import { fetchProjects, createProject, deleteProject } from "../apiProjects";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects().then(res => setProjects(res.data)).catch(() => setProjects([]));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Project name is required");
    setError(""); setBusy(true);
    try {
      const res = await createProject({ project_name: name.trim(), description: desc.trim() || null });
      setProjects(p => [res.data, ...p]);
      setName(""); setDesc("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create project");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (projectId) => {
    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
      await deleteProject(projectId);
      setProjects(p => p.filter(pr => pr.project_id !== projectId));
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete project");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Your Projects</h2>

        <form onSubmit={handleCreate} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={busy} style={styles.button}>
            {busy ? "Creating…" : "Create project"}
          </button>
        </form>

        <ul style={styles.list}>
          {projects.length === 0 && <li style={{ opacity: .7 }}>No projects yet</li>}
          {projects.map(p => (
            <li key={p.project_id} style={styles.item}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.project_name}</div>
                {p.description && <div style={{ fontSize: ".9rem", opacity: .8 }}>{p.description}</div>}
              </div>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button
                  style={styles.openBtn}
                  onClick={() => navigate(`/projects/${p.project_id}`)}
                >
                  Open
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(p.project_id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
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
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "3rem 1rem",
  },
  card: {
    width: "100%", maxWidth: 720,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,.12)",
    padding: "1.5rem"
  },
  title: { margin: "0 0 1rem 0" },
  form: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "center" },
  input: { padding: ".75rem", borderRadius: 8, border: "1px solid #ddd" },
  button: { padding: ".75rem 1rem", borderRadius: 8, border: "none", background: "#4e54c8", color: "#fff", fontWeight: 600, cursor: "pointer" },
  error: { color: "crimson", gridColumn: "1 / -1", margin: 0 },
  list: { listStyle: "none", padding: 0, marginTop: "1.25rem", display: "grid", gap: ".5rem" },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".85rem 1rem", border: "1px solid #eee", borderRadius: 10 },
  openBtn: { border: "1px solid #4e54c8", color: "#4e54c8", background: "transparent", padding: ".5rem .75rem", borderRadius: 8, cursor: "pointer" },
  deleteBtn: { border: "1px solid crimson", color: "white", background: "crimson", padding: ".5rem .75rem", borderRadius: 8, cursor: "pointer" }
};
