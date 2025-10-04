import { useAuth } from "../AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import api from "../api";

const dbLanguageMap = { javascript: 1, python: 2, cpp: 3, java: 4 };
const idToLanguage = { 1: "javascript", 2: "python", 3: "cpp", 4: "java" };
const judge0LanguageMap = { javascript: 63, python: 71, cpp: 54, java: 62 };

export default function ProjectEditor() {
  const { user, loading } = useAuth();
  const { projectId } = useParams();

  const [files, setFiles] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  const [code, setCode] = useState("// write code here");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");

  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newFileName, setNewFileName] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const dragIndex = useRef(null);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
    api
      .get(`/projects/${projectId}/files`)
      .then((res) => setFiles(res.data))
      .catch((err) => console.error(err));
  }, [projectId]);

  useEffect(() => {
    const saved = localStorage.getItem(`tabs_${projectId}`);
    if (saved) {
      const { openIds, activeId } = JSON.parse(saved);
      if (openIds?.length) {
        (async () => {
          try {
            const opened = await Promise.all(
              openIds.map((id) => api.get(`/files/${id}`).then((r) => r.data))
            );
            setOpenTabs(opened);
            setActiveTabId(activeId || opened[0]?.file_id);
            const file = opened.find((f) => f.file_id === activeId) || opened[0];
            if (file) {
              setActiveFile(file);
              setCode(file.content ?? "// empty file");
              setLanguage(idToLanguage[file.language_id] || "javascript");
            }
          } catch (e) {
            console.error("Restore tabs failed", e);
          }
        })();
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (!openTabs.length) {
      localStorage.removeItem(`tabs_${projectId}`);
      return;
    }
    const openIds = openTabs.map((t) => t.file_id);
    const data = { openIds, activeId: activeTabId };
    localStorage.setItem(`tabs_${projectId}`, JSON.stringify(data));
  }, [openTabs, activeTabId, projectId]);

  const openFile = async (file) => {
    try {
      const existing = openTabs.find((t) => t.file_id === file.file_id);
      if (existing) {
        setActiveTabId(file.file_id);
        setActiveFile(existing);
        setCode(existing.content ?? "// empty file");
        setLanguage(idToLanguage[existing.language_id] || "javascript");
        return;
      }

      const { data } = await api.get(`/files/${file.file_id}`);
      const newTab = { ...data, content: data.content ?? "// empty file" };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabId(file.file_id);
      setActiveFile(newTab);
      setCode(newTab.content);
      setLanguage(idToLanguage[newTab.language_id] || "javascript");
    } catch (err) {
      console.error(err);
    }
  };

  const createFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const { data } = await api.post(`/projects/${projectId}/files`, {
        file_name: newFileName,
        language_id: dbLanguageMap.javascript,
      });
      setFiles((prev) => [...prev, data]);
      setNewFileName("");
      openFile(data);
    } catch (err) {
      console.error(err);
      alert("Could not create file");
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
      setOpenTabs((prev) => prev.filter((t) => t.file_id !== fileId));

      if (activeTabId === fileId) {
        const next = openTabs.find((t) => t.file_id !== fileId);
        setActiveTabId(next?.file_id || null);
        setActiveFile(next || null);
        setCode(next?.content || "// write code here");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      setOutput(e.response?.data?.error || "Execution failed ❌");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    const current = openTabs.find((t) => t.file_id === activeTabId);
    if (!current) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await api.put(`/files/${current.file_id}`, {
        content: current.content,
        language_id: dbLanguageMap[language],
      });
      setSaveMsg("Saved ✅");
      setTimeout(() => setSaveMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setSaveMsg("Save failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index) => {
    dragIndex.current = index;
  };
  const handleDrop = (index) => {
    const from = dragIndex.current;
    if (from === null || from === index) return;
    const reordered = [...openTabs];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);
    setOpenTabs(reordered);
    dragIndex.current = null;
  };

  const handleExport = () => {
    if (!activeFile) return alert("No file selected!");
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const ext =
      language === "python" ? "py" :
      language === "java" ? "java" :
      language === "cpp" ? "cpp" : "js";
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
      const { data } = await api.get("/run/history", { params: { fileId: activeFile.file_id } });
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
      <div style={{ width: 220, borderRight: "1px solid #ddd", padding: "1rem" }}>
        <h3>Files in Project {projectId}</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((f) => (
            <li key={f.file_id} style={{ marginBottom: 6 }}>
              <button
                style={{
                  width: "100%",
                  background: activeFile?.file_id === f.file_id ? "#4e54c8" : "#f5f5f5",
                  color: activeFile?.file_id === f.file_id ? "#fff" : "#333",
                  border: "1px solid #ccc",
                  padding: "6px 8px",
                  borderRadius: 4,
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
          style={{ width: "100%", marginTop: ".5rem" }}
        />
        <button onClick={createFile} style={{ marginTop: ".5rem", width: "100%" }}>
          Create File
        </button>
      </div>

      <div style={{ flex: 1, padding: "1rem", ...(isFullscreen ? fullscreenStyle : {}) }}>
        {/* Tabs */}
        {openTabs.length > 0 && (
          <div style={{ display: "flex", borderBottom: "1px solid #ccc", marginBottom: ".5rem", overflowX: "auto" }}>
            {openTabs.map((tab, i) => (
              <div
                key={tab.file_id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                onClick={() => {
                  setActiveTabId(tab.file_id);
                  setActiveFile(tab);
                  setCode(tab.content);
                  setLanguage(idToLanguage[tab.language_id] || "javascript");
                }}
                style={{
                  padding: ".5rem 1rem",
                  background: tab.file_id === activeTabId ? "#4e54c8" : "#eaeaea",
                  color: tab.file_id === activeTabId ? "#fff" : "#333",
                  borderRight: "1px solid #ccc",
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {tab.file_name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTabs((prev) => prev.filter((t) => t.file_id !== tab.file_id));
                    if (tab.file_id === activeTabId) {
                      const next = openTabs.find((t) => t.file_id !== tab.file_id);
                      setActiveTabId(next?.file_id || null);
                      setActiveFile(next || null);
                      setCode(next?.content || "// write code here");
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: tab.file_id === activeTabId ? "#fff" : "#333",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                  title="Close tab"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {activeFile ? (
          <>
            <div style={{ marginBottom: "1rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
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
                onClick={() => deleteFile(activeFile.file_id)}
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
              onChange={(val) => {
                setCode(val);
                setOpenTabs((prev) =>
                  prev.map((t) => (t.file_id === activeTabId ? { ...t, content: val } : t))
                );
              }}
            />

            <div style={outBox}>
              <strong>Output:</strong>
              <div>{output}</div>
            </div>
          </>
        ) : (
          <h3>Select a file to start editing</h3>
        )}
      </div>

      {showHistory && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>📜 Execution History</h3>
            <ul style={{ maxHeight: 400, overflowY: "auto", padding: 0, listStyle: "none" }}>
              {history.map((h) => (
                <li
                  key={h.execution_id}
                  onClick={async () => {
                    try {
                      const { data } = await api.get(`/run/history/${h.execution_id}`);
                      setCode(data.content_executed);
                      setLanguage(data.language);
                      setStdin(data.input || "");
                      setOutput(data.output || data.stderr || data.compile_output || "No output");
                      setShowHistory(false);
                    } catch (err) {
                      console.error(err);
                      alert("Could not load history entry");
                    }
                  }}
                  style={{
                    borderBottom: "1px solid #ddd",
                    marginBottom: 8,
                    padding: 8,
                    cursor: "pointer",
                    background: "#fafafa",
                    borderRadius: 6,
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
            <button onClick={() => setShowHistory(false)} style={btnSecondary}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = {
  padding: ".4rem 1rem",
  background: "#4e54c8",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
const btnSecondary = {
  padding: ".4rem 1rem",
  background: "#eaeaea",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};
const outBox = {
  marginTop: "1rem",
  padding: "1rem",
  background: "#f7f7f7",
  borderRadius: 8,
  border: "1px solid #ddd",
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
};
const fullscreenStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "#1e1e2f",
  zIndex: 2000,
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalBox = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: 10,
  width: 400,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
};
