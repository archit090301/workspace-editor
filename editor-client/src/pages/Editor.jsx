// src/pages/Editor.jsx
import { useAuth } from "../AuthContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import api from "../api";

// DB language IDs
const dbLanguageMap = { javascript: 1, python: 2, cpp: 3, java: 4 };
const idToLanguage = { 1: "javascript", 2: "python", 3: "cpp", 4: "java" };

// Judge0 IDs
const judge0LanguageMap = { javascript: 63, python: 71, cpp: 54, java: 62 };

export default function Editor() {
  const { user, loading } = useAuth();
  const { projectId, fileId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("// write code here");
  const [status, setStatus] = useState("loading");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [fileName, setFileName] = useState("");

  // Scratchpad state
  const [projects, setProjects] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [scratchpadFileName, setScratchpadFileName] = useState("scratchpad.js");

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Execution history state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  // Fetch file details
  useEffect(() => {
    if (!fileId) {
      setStatus("ready");
      api.get("/projects").then((res) => setProjects(res.data)).catch(console.error);
      return;
    }
    api.get(`/files/${fileId}`)
      .then((res) => {
        const f = res.data || {};
        setCode(f.content ?? "// new file");
        setLanguage(idToLanguage[f.language_id] || "javascript");
        setFileName(f.file_name || `File ${fileId}`);
        setStatus("ready");
      })
      .catch(() => {
        setCode("// error loading file");
        setStatus("error");
      });
  }, [fileId]);

  const getExtensions = () => {
    switch (language) {
      case "python": return [python()];
      case "java": return [java()];
      case "cpp": return [cpp()];
      default: return [javascript()];
    }
  };

  // Run
  const handleRun = async () => {
    setRunning(true);
    setOutput("⚡ Running...");
    try {
      const { data } = await api.post("/run", {
        language,
        languageId: judge0LanguageMap[language],
        code,
        stdin,
      });
      let out = "";
      if (data.stdout) out += `✅ Output:\n${data.stdout}\n`;
      if (data.stderr) out += `⚠️ Runtime Error:\n${data.stderr}\n`;
      if (data.compile_output) out += `❌ Compilation Error:\n${data.compile_output}\n`;
      if (!out.trim()) out = "No output";
      setOutput(out);
    } catch {
      setOutput("❌ Execution failed");
    } finally {
      setRunning(false);
    }
  };

  // Save
  const handleSave = async () => {
    if (!fileId) {
      setShowSaveDialog(true);
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put(`/files/${fileId}`, {
        content: code,
        language_id: dbLanguageMap[language],
      });
      setSaveMsg("💾 Saved");
      setTimeout(() => setSaveMsg(""), 1500);
    } catch {
      setSaveMsg("❌ Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Save Scratchpad
  const handleSaveToProject = async () => {
    try {
      let projectIdToUse = selectedProject;
      if (!projectIdToUse && newProjectName.trim()) {
        const { data: newProj } = await api.post("/projects", { project_name: newProjectName.trim() });
        projectIdToUse = newProj.project_id;
      }
      if (!projectIdToUse) return alert("Select or create a project.");

      const { data: file } = await api.post(`/projects/${projectIdToUse}/files`, {
        file_name: scratchpadFileName,
        language_id: dbLanguageMap[language],
        content: code,
      });
      setSaveMsg(`💾 Saved to ${file.file_name}`);
      setShowSaveDialog(false);
      navigate(`/projects/${projectIdToUse}/files/${file.file_id}`);
    } catch {
      setSaveMsg("❌ Save failed");
    }
  };

  // Export (download file)
  const handleExport = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const ext =
      language === "python" ? "py"
      : language === "java" ? "java"
      : language === "cpp" ? "cpp"
      : "js";
    const filename = fileName || `scratchpad.${ext}`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import (upload file)
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target.result);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Show history
  // Show history
const handleShowHistory = async () => {
  setShowHistory(true);
  try {
    const { data } = await api.get("/run/history?scratchpad=true&limit=10");
    setHistory(data);
  } catch {
    setHistory([]);
  }
};


  const editorTheme = user?.preferred_theme_id === 2 ? oneDark : "light";

  return (
    <div style={{ ...styles.wrapper, ...(isFullscreen ? styles.fullscreen : {}) }}>
      {/* Toolbar */}
      <div style={{
        ...styles.toolbar,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? "0.5rem" : "1rem"
      }}>
        <span style={{
          ...styles.fileInfo,
          marginBottom: isMobile ? "0.5rem" : 0
        }}>
          {fileId ? `${fileName} • Project ${projectId}` : "Scratchpad"}
        </span>
        <div style={{
          ...styles.controls,
          flexWrap: isMobile ? "wrap" : "nowrap",
          width: isMobile ? "100%" : "auto",
          justifyContent: isMobile ? "flex-start" : "flex-end"
        }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
            <option value="javascript">JS</option>
            <option value="python">Py</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={handleRun} disabled={running} style={styles.btnRun}>
            ▶ {running ? "Running..." : "Run"}
          </button>
          <button onClick={handleSave} disabled={saving} style={styles.btnSave}>
            💾 {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={handleExport} style={styles.btnExport}>⬇ Export</button>
          <label style={styles.btnImport}>
            ⬆ Import
            <input type="file" accept=".js,.py,.java,.cpp,.txt" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button onClick={toggleFullscreen} style={styles.btnFullscreen}>
            {isFullscreen ? "🗕 Exit Fullscreen" : "🗖 Fullscreen"}
          </button>
          <button onClick={handleShowHistory} style={styles.btnHistory}>📜 History</button>
          {saveMsg && <span style={styles.badge}>{saveMsg}</span>}
        </div>
      </div>

      {/* Split Layout */}
      <div style={{
        ...styles.main,
        flexDirection: isMobile ? "column" : "row"
      }}>
        <div style={{
          ...styles.editorPane,
          borderRight: isMobile ? "none" : "1px solid #ddd",
          borderBottom: isMobile ? "1px solid #ddd" : "none"
        }}>
          {status === "loading" ? (
            <p>Loading...</p>
          ) : (
            <CodeMirror
              value={code}
              height={isFullscreen ? "calc(100vh - 60px)" : isMobile ? "40vh" : "70vh"}
              theme={editorTheme}
              extensions={getExtensions()}
              onChange={(val) => setCode(val)}
            />
          )}
        </div>
        
        {!isFullscreen && (
          <div style={{
            ...styles.ioPane,
            flexDirection: "column"
          }}>
            <div style={{ ...styles.ioSection, flex: isMobile ? "none" : 1 }}>
              <label style={styles.ioLabel}>Input</label>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="stdin..."
                style={{
                  ...styles.textarea,
                  height: isMobile ? "100px" : "100%",
                  resize: "vertical"
                }}
              />
            </div>
            <div style={{ ...styles.ioSection, flex: isMobile ? "none" : 1 }}>
              <label style={styles.ioLabel}>Output</label>
              <pre
                style={{
                  ...styles.output,
                  height: isMobile ? "auto" : "100%",
                  maxHeight: isMobile ? "40vh" : "none",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap"
                }}
              >
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveDialog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3>💾 Save Scratchpad</h3>
            <input value={scratchpadFileName} onChange={(e) => setScratchpadFileName(e.target.value)} style={styles.input}/>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={styles.input}>
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
              ))}
            </select>
            <input placeholder="New project name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} style={styles.input}/>
            <div style={styles.modalBtns}>
              <button onClick={handleSaveToProject} style={styles.btnRun}>Save</button>
              <button onClick={() => setShowSaveDialog(false)} style={styles.btnSave}>Cancel</button>
            </div>
          </div>
        </div>
      )}

            {/* History Modal */}
      {showHistory && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3>📜 Execution History</h3>
            {history.length === 0 ? (
              <p>No runs yet</p>
            ) : (
              <ul style={{ maxHeight: "300px", overflowY: "auto", padding: "0.5rem", listStyle: "none" }}>
                {history.map(h => (
                  <li
                    key={h.execution_id}
                    onClick={async () => {
                      try {
                        const { data } = await api.get(`/run/history/${h.execution_id}`);
                        setCode(data.content_executed);
                        setLanguage(data.language);
                        setStdin(data.input || "");
                        setOutput(
                          data.output ||
                          data.stderr ||
                          data.compile_output ||
                          "No output"
                        );
                        setShowHistory(false); // close modal after loading
                      } catch (err) {
                        console.error(err);
                        alert("Could not load history entry");
                      }
                    }}
                    style={{
                      marginBottom: "0.8rem",
                      borderBottom: "1px solid #ddd",
                      paddingBottom: "0.5rem",
                      cursor: "pointer",
                      background: "#fafafa",
                      borderRadius: "6px",
                      padding: "0.5rem"
                    }}
                  >
                    <strong>{h.language}</strong> • {h.status}
                    <br />
                    <small>{new Date(h.timestamp).toLocaleString()}</small>
                    <br />
                    <small style={{ color: "#666" }}>Click to load</small>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowHistory(false)} style={styles.btnSave}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  wrapper: { height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" },
  fullscreen: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#1e1e2f", zIndex: 2000,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 1.2rem",
    background: "linear-gradient(90deg,#667eea,#764ba2)",
    color: "#fff",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    position: "sticky",
    top: 0,
    zIndex: 1000
  },
  fileInfo: { fontWeight: "500" },
  controls: { display: "flex", gap: "0.5rem", alignItems: "center" },
  select: { padding: "0.3rem", borderRadius: "6px", border: "1px solid #ccc" },
  btnRun: {
    padding: "0.4rem 1rem", border: "none", borderRadius: "6px",
    background: "linear-gradient(90deg,#43e97b,#38f9d7)", color: "#fff", cursor: "pointer", fontWeight: "600",
  },
  btnSave: {
    padding: "0.4rem 1rem", border: "1px solid #ccc", borderRadius: "6px",
    background: "#fff", cursor: "pointer", fontWeight: "500",
  },
  btnExport: {
    padding: "0.4rem 1rem", border: "1px solid #ccc", borderRadius: "6px",
    background: "#f1f1f1", cursor: "pointer", fontWeight: "500",
  },
  btnImport: {
    padding: "0.4rem 1rem", border: "1px solid #ccc", borderRadius: "6px",
    background: "#f1f1f1", cursor: "pointer", fontWeight: "500",
  },
  btnFullscreen: {
    padding: "0.4rem 1rem", border: "1px solid #ccc", borderRadius: "6px",
    background: "#333", color: "#fff", cursor: "pointer", fontWeight: "500",
  },
  btnHistory: {
    padding: "0.4rem 1rem", border: "1px solid #ccc", borderRadius: "6px",
    background: "#f1f1f1", cursor: "pointer", fontWeight: "500",
  },
  badge: { marginLeft: "8px", fontSize: "0.85rem", color: "#fff", background: "#222", padding: "0.2rem 0.6rem", borderRadius: "4px" },
  main: { flex: 1, display: "flex" },
  editorPane: { flex: 2 },
  ioPane: { flex: 1, display: "flex", background: "#fafafa" },
  ioSection: { flex: 1, padding: "1rem", display: "flex", flexDirection: "column" },
  ioLabel: { marginBottom: "0.5rem", fontWeight: "600" },
  textarea: { flex: 1, borderRadius: "6px", border: "1px solid #ccc", padding: "0.5rem", fontFamily: "monospace" },
  output: { flex: 1, borderRadius: "6px", border: "1px solid #ddd", padding: "0.5rem", background: "#1e1e2f", color: "#0f0", fontFamily: "monospace" },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
  },
  modalBox: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "400px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  input: { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc", marginBottom: "1rem" },
  modalBtns: { display: "flex", gap: "0.5rem", justifyContent: "flex-end" },
};
