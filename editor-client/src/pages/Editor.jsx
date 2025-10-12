import { useAuth } from "../AuthContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
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

  const [projects, setProjects] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [scratchpadFileName, setScratchpadFileName] = useState("scratchpad.js");

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "sys-hello",
      role: "assistant",
      content:
        "Hi! I’m your AI helper. I can explain code, find bugs, optimize logic, write tests, and draft docstrings. What would you like me to do?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [includeCode, setIncludeCode] = useState(true);
  const [includeStdin, setIncludeStdin] = useState(false);
  const [includeOutput, setIncludeOutput] = useState(true);
  const [includeFileMeta, setIncludeFileMeta] = useState(true);
  const chatListRef = useRef(null);

  const editorRef = useRef(null);

  const scrollChatToEnd = useCallback(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, []);
  useEffect(() => { scrollChatToEnd(); }, [chatMessages, scrollChatToEnd]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

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

  const handleExportOutput = () => {
  if (!output.trim()) {
    alert("No output to export.");
    return;
  }

  const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
  const filename = `${fileName ? fileName.split(".")[0] : "output"}_result.txt`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


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

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleShowHistory = async () => {
    setShowHistory(true);
    try {
      const { data } = await api.get("/run/history?scratchpad=true&limit=10");
      setHistory(data);
    } catch {
      setHistory([]);
    }
  };

  const buildContext = () => ({
    language,
    fileName: fileName || (fileId ? `File ${fileId}` : "scratchpad"),
    projectId: projectId || null,
    code: includeCode ? code : "",
    stdin: includeStdin ? stdin : "",
    output: includeOutput ? output : "",
    history: history?.slice(0, 10) || []
  });

  const sendChat = async (userText) => {
  if (!userText?.trim()) return;
  setChatting(true);

  const newUserMsg = { id: `u-${Date.now()}`, role: "user", content: userText.trim() };
  setChatMessages((msgs) => [...msgs, newUserMsg]);

  const payload = {
    messages: [...chatMessages.filter(m => m.role !== "system"), newUserMsg].map(({ role, content }) => ({ role, content })),
    context: buildContext()
  };

  try {
    const resp = await api.post("/ai/chat", payload);
    const text = resp?.data?.assistant || "⚠️ No response from AI.";
    setChatMessages((msgs) => [
      ...msgs,
      { id: `a-${Date.now()}`, role: "assistant", content: text }
    ]);
  } catch (err) {
    console.error("Chat error:", err);
    setChatMessages((msgs) => [
      ...msgs,
      { id: `a-${Date.now()}`, role: "assistant", content: "❌ AI request failed (network/server issue)." }
    ]);
  } finally {
    setChatting(false);
  }
};


  const handleQuickAsk = (prompt) => {
    setShowChat(true);
    setChatInput(prompt);
  };

  const insertAtCursor = (text) => {
    const view = editorRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({ changes: { from, to, insert: text } });
    view.focus();
  };

  const editorTheme = user?.preferred_theme_id === 2 ? oneDark : "light";

  const onChatKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!chatting) {
        const txt = chatInput;
        setChatInput("");
        sendChat(txt);
      }
    }
  };

  return (
    <div style={{ ...styles.wrapper, ...(isFullscreen ? styles.fullscreen : {}) }}>
      <div style={{
        ...styles.toolbar,
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? "0.5rem" : "1rem"
      }}>
        <span style={{ ...styles.fileInfo, marginBottom: isMobile ? "0.5rem" : 0 }}>
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
          <button onClick={handleExportOutput} style={styles.btnExport}>📤 Export Output</button>
          <label style={styles.btnImport}>
            ⬆ Import
            <input type="file" accept=".js,.py,.java,.cpp,.txt" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button onClick={toggleFullscreen} style={styles.btnFullscreen}>
            {isFullscreen ? "🗕 Exit Fullscreen" : "🗖 Fullscreen"}
          </button>
          <button onClick={handleShowHistory} style={styles.btnHistory}>📜 History</button>
          <button onClick={() => setShowChat(s => !s)} style={styles.btnAI}>
            {showChat ? "🤖 Hide Chat" : "🤖 AI Chat"}
          </button>
          {saveMsg && <span style={styles.badge}>{saveMsg}</span>}
        </div>
      </div>

      <div style={{
        ...styles.main,
        flexDirection: isMobile ? "column" : "row"
      }}>
        <div style={{
          ...styles.editorPane,
          borderRight: (!isMobile && !isFullscreen && showChat) ? "1px solid #ddd" : (isMobile ? "none" : "1px solid #ddd"),
          borderBottom: isMobile ? "1px solid #ddd" : "none",
          flex: (!isFullscreen && showChat && !isMobile) ? 1.6 : 2
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
              onCreateEditor={(view) => { editorRef.current = view; }}
            />
          )}
        </div>

        {!isFullscreen && (
          <div style={{
            ...styles.ioPane,
            flexDirection: "column",
            display: showChat && !isMobile ? "none" : "flex" 
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

        {!isFullscreen && showChat && (
          <div style={{
            ...styles.chatPanel,
            position: isMobile ? "fixed" : "relative",
            right: isMobile ? 0 : "auto",
            top: isMobile ? 0 : "auto",
            width: isMobile ? "100%" : "32rem",
            height: isMobile ? "100vh" : "auto",
            zIndex: 2500,
          }}>
            <div style={styles.chatHeader}>
              <strong>🤖 AI Assistant</strong>
              <button onClick={() => setShowChat(false)} style={styles.chatCloseBtn}>✖</button>
            </div>

            <div style={styles.contextRow}>
              <label style={styles.ck}><input type="checkbox" checked={includeCode} onChange={() => setIncludeCode(v => !v)} /> Code</label>
              <label style={styles.ck}><input type="checkbox" checked={includeOutput} onChange={() => setIncludeOutput(v => !v)} /> Output</label>
              <label style={styles.ck}><input type="checkbox" checked={includeStdin} onChange={() => setIncludeStdin(v => !v)} /> Stdin</label>
              <label style={styles.ck}><input type="checkbox" checked={includeFileMeta} onChange={() => setIncludeFileMeta(v => !v)} /> Meta</label>
            </div>

            <div style={styles.quickRow}>
              {[
                "Explain what this code does.",
                "Find the bug and fix it.",
                "Optimize time & space complexity.",
                "Write unit tests for the core logic.",
                "Add clear docstrings and comments."
              ].map((q) => (
                <button key={q} onClick={() => handleQuickAsk(q)} style={styles.quickBtn}>{q}</button>
              ))}
            </div>

            <div ref={chatListRef} style={styles.chatList}>
              {chatMessages.map((m) => (
                <div key={m.id} style={{
                  ...styles.chatMsg,
                  background: m.role === "assistant" ? "#f7f9ff" : "#f1fff6",
                  borderColor: m.role === "assistant" ? "#dfe7ff" : "#c8f1d6"
                }}>
                  <div style={styles.msgTop}>
                    <span style={styles.msgRole}>{m.role === "assistant" ? "Assistant" : "You"}</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        title="Copy"
                        onClick={() => navigator.clipboard.writeText(m.content)}
                        style={styles.msgBtn}
                      >Copy</button>
                      {m.role === "assistant" && (
                        <button
                          title="Insert into editor"
                          onClick={() => insertAtCursor(m.content)}
                          style={styles.msgBtn}
                        >Insert</button>
                      )}
                    </div>
                  </div>
                  <div style={styles.msgBody}>{m.content}</div>
                </div>
              ))}
            </div>

            <div style={styles.chatComposer}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={onChatKeyDown}
                placeholder="Ask the AI… (Ctrl/⌘+Enter to send)"
                style={styles.chatInput}
              />
              <div style={styles.chatActions}>
                <button
                  onClick={() => { setChatMessages([{ id: "sys-hello", role: "assistant", content: "Chat cleared." }]); }}
                  style={styles.clearBtn}
                  disabled={chatting}
                >Clear</button>
                <button
                  onClick={() => { const txt = chatInput; setChatInput(""); sendChat(txt); }}
                  style={styles.sendBtn}
                  disabled={chatting || !chatInput.trim()}
                >{chatting ? "Sending…" : "Send"}</button>
              </div>
              <div style={styles.hint}>Tip: Include code/output toggles above to give the AI more context.</div>
            </div>
          </div>
        )}
      </div>

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
                        setShowHistory(false);
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
  btnAI: {
    padding: "0.4rem 1rem", border: "1px solid #ccc", borderRadius: "6px",
    background: "#111", color: "#fff", cursor: "pointer", fontWeight: "600",
  },
  badge: { marginLeft: "8px", fontSize: "0.85rem", color: "#fff", background: "#222", padding: "0.2rem 0.6rem", borderRadius: "4px" },
  main: { flex: 1, display: "flex", position: "relative" },
  editorPane: { flex: 2, minWidth: 0 },
  ioPane: { flex: 1, display: "flex", background: "#fafafa", minWidth: 0 },
  ioSection: { flex: 1, padding: "1rem", display: "flex", flexDirection: "column" },
  ioLabel: { marginBottom: "0.5rem", fontWeight: "600" },
  textarea: { flex: 1, borderRadius: "6px", border: "1px solid #ccc", padding: "0.5rem", fontFamily: "monospace" },
  output: { flex: 1, borderRadius: "6px", border: "1px solid #ddd", padding: "0.5rem", background: "#1e1e2f", color: "#0f0", fontFamily: "monospace" },

  chatPanel: {
    background: "#ffffff",
    borderLeft: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 0.9rem",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb"
  },
  chatCloseBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: "6px",
    padding: "0.2rem 0.5rem",
    cursor: "pointer"
  },
  contextRow: {
    display: "flex",
    gap: "0.75rem",
    padding: "0.6rem 0.9rem",
    borderBottom: "1px solid #eee",
    flexWrap: "wrap"
  },
  ck: { fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" },
  quickRow: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.5rem 0.9rem",
    borderBottom: "1px solid #f0f0f0",
    flexWrap: "wrap"
  },
  quickBtn: {
    fontSize: "0.85rem",
    padding: "0.35rem 0.5rem",
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer"
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    padding: "0.9rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    background: "#fff"
  },
  chatMsg: {
    border: "1px solid",
    borderRadius: "10px",
    padding: "0.6rem 0.7rem"
  },
  msgTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.25rem"
  },
  msgRole: {
    fontSize: "0.8rem",
    opacity: 0.8
  },
  msgBtn: {
    fontSize: "0.75rem",
    border: "1px solid #ddd",
    background: "#fff",
    padding: "0.2rem 0.4rem",
    borderRadius: "6px",
    cursor: "pointer"
  },
  msgBody: {
    whiteSpace: "pre-wrap",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
  },
  chatComposer: {
    borderTop: "1px solid #e5e7eb",
    padding: "0.6rem 0.9rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    background: "#fafafa"
  },
  chatInput: {
    width: "100%",
    minHeight: "70px",
    maxHeight: "160px",
    resize: "vertical",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    padding: "0.6rem",
    fontFamily: "inherit"
  },
  chatActions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.6rem"
  },
  clearBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: "6px",
    padding: "0.4rem 0.8rem",
    cursor: "pointer"
  },
  sendBtn: {
    border: "none",
    background: "linear-gradient(90deg,#43e97b,#38f9d7)",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.45rem 1rem",
    cursor: "pointer",
    fontWeight: 600
  },
  hint: { fontSize: "0.75rem", color: "#6b7280" },

  modalOverlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 3000
  },
  modalBox: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "400px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  input: { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ccc", marginBottom: "1rem" },
  modalBtns: { display: "flex", gap: "0.5rem", justifyContent: "flex-end" },
};
