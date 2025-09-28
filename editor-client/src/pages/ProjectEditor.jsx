// src/pages/ProjectEditor.jsx
import { useAuth } from "../AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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

export default function ProjectEditor() {
  const { user, loading } = useAuth();
  const { projectId } = useParams();

  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState("// write code here");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newFileName, setNewFileName] = useState("");

  // ✅ New states for extras
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  // Fetch all files in this project
  useEffect(() => {
    api.get(`/projects/${projectId}/files`)
      .then((res) => setFiles(res.data))
      .catch((err) => console.error(err));
  }, [projectId]);

  // Load file into editor
  const openFile = async (file) => {
    try {
      const { data } = await api.get(`/files/${file.file_id}`);
      setActiveFile(data);
      setCode(data.content ?? "// empty file");
      setLanguage(idToLanguage[data.language_id] || "javascript");
    } catch (err) {
      console.error(err);
    }
  };

  // Create a new file
  const createFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const { data } = await api.post(`/projects/${projectId}/files`, {
        file_name: newFileName,
        language_id: dbLanguageMap.javascript,
      });
      setFiles([...files, data]);
      setNewFileName("");
      openFile(data);
    } catch (err) {
      console.error(err);
      alert("Could not create file");
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    const confirmed = window.confirm("Are you sure you want to delete this file?");
    if (!confirmed) return;

    try {
      await api.delete(`/files/${fileId}`);
      setFiles(files.filter((f) => f.file_id !== fileId));
      if (activeFile?.file_id === fileId) {
        setActiveFile(null);
        setCode("// write code here");
        setOutput("");
      }
    } catch (err) {
      console.error(err);
      alert("Could not delete file");
    }
  };

  // Run code
  const handleRun = async () => {
    setRunning(true);
    setOutput("Running...");
    try {
      const { data } = await api.post("/run", {
        language,
        languageId: judge0LanguageMap[language],
        code,
        stdin,
        fileId: activeFile?.file_id,
      });

      let out = "";
      if (data.stdout) out += `✅ Output:\n${data.stdout}\n`;
      if (data.stderr) out += `⚠️ Runtime Error:\n${data.stderr}\n`;
      if (data.compile_output) out += `❌ Compilation Error:\n${data.compile_output}\n`;
      if (!out.trim()) out = "No output";

      setOutput(out);
    } catch (e) {
      console.error(e);
      setOutput(e.response?.data?.error || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  // Save file
  const handleSave = async () => {
    if (!activeFile) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put(`/files/${activeFile.file_id}`, {
        content: code,
        language_id: dbLanguageMap[language],
      });
      setSaveMsg("Saved ✅");
      setTimeout(() => setSaveMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Import / Export / Fullscreen / History
  const handleExport = () => {
    if (!activeFile) return alert("No file selected!");
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const ext =
      language === "python" ? "py"
      : language === "java" ? "java"
      : language === "cpp" ? "cpp"
      : "js";
    const filename = activeFile.file_name || `file.${ext}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCode(ev.target.result);
    reader.readAsText(file);
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const loadHistory = async () => {
    if (!activeFile) return;
    try {
      const { data } = await api.get("/run/history", {
        params: { fileId: activeFile.file_id },
      });
      setHistory(data);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getExtensions = () => {
    switch (language) {
      case "python": return [python()];
      case "java": return [java()];
      case "cpp": return [cpp()];
      default: return [javascript()];
    }
  };

  const editorTheme = user?.preferred_theme_id === 2 ? oneDark : "light";

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "220px", borderRight: "1px solid #ddd", padding: "1rem" }}>
        <h3>Files in Project {projectId}</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((f) => (
            <li key={f.file_id} style={{ marginBottom: "6px" }}>
              <button
                style={{
                  width: "100%",
                  background: activeFile?.file_id === f.file_id ? "#4e54c8" : "#f5f5f5",
                  color: activeFile?.file_id === f.file_id ? "#fff" : "#333",
                  border: "1px solid #ccc",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onClick={() => openFile(f)}
              >
                {f.file_name}
              </button>
            </li>
          ))}
        </ul>

        <input
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="New file name"
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
        <button onClick={createFile} style={{ marginTop: "0.5rem", width: "100%" }}>
          Create File
        </button>
      </div>

      {/* Editor panel */}
      <div style={{ flex: 1, padding: "1rem", ...(isFullscreen ? fullscreenStyle : {}) }}>
        <h2>{activeFile ? `Editing ${activeFile.file_name}` : "Select a file to start editing"}</h2>

        {activeFile && (
          <>
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <label>Language:</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <button onClick={handleRun} disabled={running} style={btnPrimary}>
                {running ? "Running..." : "Run"}
              </button>
              <button onClick={handleSave} disabled={saving} style={btnSecondary}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => activeFile && deleteFile(activeFile.file_id)}
                style={{ ...btnSecondary, background: "red", color: "#fff", border: "none" }}
              >
                Delete
              </button>

              <button onClick={handleExport} style={btnSecondary}>⬇ Export</button>
              <label style={btnSecondary}>
                ⬆ Import
                <input type="file" accept=".js,.py,.java,.cpp,.txt" onChange={handleImport} style={{ display: "none" }} />
              </label>
              <button onClick={toggleFullscreen} style={btnSecondary}>
                {isFullscreen ? "🗕 Exit Fullscreen" : "🗖 Fullscreen"}
              </button>
              <button onClick={loadHistory} style={btnSecondary}>📜 History</button>

              {saveMsg && <span>{saveMsg}</span>}
            </div>

            <CodeMirror
              value={code}
              height={isFullscreen ? "80vh" : "60vh"}
              width="100%"
              theme={editorTheme}
              extensions={getExtensions()}
              onChange={(val) => setCode(val)}
            />

            <div style={outBox}>
              <strong>Output:</strong>
              <div>{output}</div>
            </div>
          </>
        )}
      </div>
            {/* History Modal */}
      {showHistory && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>📜 Execution History</h3>
            <ul style={{ maxHeight: "400px", overflowY: "auto", padding: 0, listStyle: "none" }}>
              {history.map((h) => (
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
                    borderBottom: "1px solid #ddd",
                    marginBottom: "8px",
                    padding: "8px",
                    cursor: "pointer",
                    background: "#fafafa",
                    borderRadius: "6px",
                  }}
                >
                  <strong>{h.language}</strong> • {h.status}
                  <br />
                  {new Date(h.timestamp).toLocaleString()}
                  <br />
                  <small style={{ color: "#666" }}>Click to load</small>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowHistory(false)} style={btnSecondary}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

const btnPrimary = {
  padding: "0.4rem 1rem",
  background: "#4e54c8",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const btnSecondary = {
  padding: "0.4rem 1rem",
  background: "#eaeaea",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
};

const outBox = {
  marginTop: "1rem",
  padding: "1rem",
  background: "#f7f7f7",
  borderRadius: "8px",
  border: "1px solid #ddd",
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
};

const fullscreenStyle = {
  position: "fixed",
  top: 0, left: 0,
  width: "100%", height: "100%",
  background: "#1e1e2f",
  zIndex: 2000,
};

const modalOverlay = {
  position: "fixed",
  top: 0, left: 0,
  width: "100%", height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalBox = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "10px",
  width: "400px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
};
