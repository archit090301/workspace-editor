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
      content: "Hi! I'm your AI helper. I can explain code, find bugs, optimize logic, write tests, and draft docstrings. What would you like me to do?"
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const handleMobileMenuAction = (action) => {
    setShowMobileMenu(false);
    switch (action) {
      case 'save': handleSave(); break;
      case 'export': handleExport(); break;
      case 'exportOutput': handleExportOutput(); break;
      case 'import': document.querySelector('input[type="file"]').click(); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'history': handleShowHistory(); break;
      case 'ai': setShowChat(true); break;
      default: break;
    }
  };

  return (
    <div style={isFullscreen ? styles.fullscreenWrapper : styles.wrapper}>
      <div style={styles.header}>
        <h1 style={styles.title}>CodeEditor</h1>
        <div style={styles.subHeader}>
          <h2 style={styles.subtitle}>Project Editor</h2>
          <div style={styles.fileInfo}>
            {fileId ? `${fileName} • Project ${projectId}` : "Scratchpad"}
          </div>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.toolbarMain}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <button onClick={handleRun} disabled={running} style={styles.btnRun}>
            ▶ {running ? "Running..." : "Run Code"}
          </button>
          
          <button onClick={handleSave} disabled={saving} style={styles.btnSave}>
            💾 {saving ? "Saving..." : "Save"}
          </button>

          {isMobile && (
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={styles.mobileMenuBtn}
            >
              ☰ Tools
            </button>
          )}
        </div>

        {(!isMobile || showMobileMenu) && (
          <div style={isMobile ? styles.mobileMenu : styles.toolbarSecondary}>
            <button onClick={handleExport} style={styles.btnSecondary}>⬇ Export Code</button>
            <button onClick={handleExportOutput} style={styles.btnSecondary}>📤 Export Output</button>
            <label style={styles.btnSecondary}>
              ⬆ Import
              <input type="file" accept=".js,.py,.java,.cpp,.txt" onChange={handleImport} style={{ display: "none" }} />
            </label>
            <button onClick={toggleFullscreen} style={styles.btnSecondary}>
              {isFullscreen ? "🗕 Exit Fullscreen" : "🗖 Fullscreen"}
            </button>
            <button onClick={handleShowHistory} style={styles.btnSecondary}>📜 History</button>
            <button onClick={() => setShowChat(s => !s)} style={styles.btnAI}>
              {showChat ? "🤖 Hide AI" : "🤖 AI Assistant"}
            </button>
          </div>
        )}
        
        {saveMsg && <span style={styles.badge}>{saveMsg}</span>}
      </div>

      {isMobile && showMobileMenu && (
        <div style={styles.mobileOverlay} onClick={() => setShowMobileMenu(false)}>
          <div style={styles.mobileMenuPanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileMenuHeader}>
              <h3>Tools Menu</h3>
              <button onClick={() => setShowMobileMenu(false)} style={styles.closeBtn}>✖</button>
            </div>
            <div style={styles.mobileMenuContent}>
              <button onClick={() => handleMobileMenuAction('export')} style={styles.mobileMenuItem}>
                ⬇ Export Code
              </button>
              <button onClick={() => handleMobileMenuAction('exportOutput')} style={styles.mobileMenuItem}>
                📤 Export Output
              </button>
              <button onClick={() => handleMobileMenuAction('import')} style={styles.mobileMenuItem}>
                ⬆ Import File
              </button>
              <button onClick={() => handleMobileMenuAction('fullscreen')} style={styles.mobileMenuItem}>
                {isFullscreen ? "🗕 Exit Fullscreen" : "🗖 Fullscreen"}
              </button>
              <button onClick={() => handleMobileMenuAction('history')} style={styles.mobileMenuItem}>
                📜 History
              </button>
              <button onClick={() => handleMobileMenuAction('ai')} style={styles.mobileMenuItem}>
                🤖 AI Assistant
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.mainContent}>
        {/* Editor Section */}
        <div style={styles.editorSection}>
          <div style={styles.editorHeader}>
            <h3 style={styles.sectionTitle}>Editor</h3>
            <div style={styles.editorInfo}>
              <span style={styles.languageBadge}>{language}</span>
              {fileId && <span style={styles.fileBadge}>{fileName}</span>}
            </div>
          </div>
          
          <div style={styles.codeMirrorContainer}>
            {status === "loading" ? (
              <div style={styles.loading}>Loading editor...</div>
            ) : (
              <CodeMirror
                value={code}
                height={isMobile ? "50vh" : "65vh"}
                theme={editorTheme}
                extensions={getExtensions()}
                onChange={(val) => setCode(val)}
                onCreateEditor={(view) => { editorRef.current = view; }}
              />
            )}
          </div>
        </div>

        {!isFullscreen && (
          <div style={styles.ioSection}>
            <div style={styles.ioColumn}>
              <div style={styles.ioPanel}>
                <h3 style={styles.sectionTitle}>Input</h3>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input here..."
                  style={styles.textarea}
                />
              </div>
              
              <div style={styles.ioPanel}>
                <h3 style={styles.sectionTitle}>Output</h3>
                <pre style={styles.output}>
                  {output || "Run your code to see output here..."}
                </pre>
              </div>
            </div>
          </div>
        )}

        {!isFullscreen && showChat && (
          <div style={styles.chatSection}>
            <div style={styles.chatPanel}>
              <div style={styles.chatHeader}>
                <h3 style={styles.sectionTitle}>🤖 AI Assistant</h3>
                <button onClick={() => setShowChat(false)} style={styles.closeBtn}>✖</button>
              </div>
              
              <div style={styles.chatContent}>
                <div style={styles.contextRow}>
                  <label style={styles.ck}><input type="checkbox" checked={includeCode} onChange={() => setIncludeCode(v => !v)} /> Code</label>
                  <label style={styles.ck}><input type="checkbox" checked={includeOutput} onChange={() => setIncludeOutput(v => !v)} /> Output</label>
                  <label style={styles.ck}><input type="checkbox" checked={includeStdin} onChange={() => setIncludeStdin(v => !v)} /> Input</label>
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
                            onClick={() => navigator.clipboard.writeText(m.content)}
                            style={styles.msgBtn}
                          >Copy</button>
                          {m.role === "assistant" && (
                            <button
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
                  <button
                    onClick={() => { const txt = chatInput; setChatInput(""); sendChat(txt); }}
                    style={styles.sendBtn}
                    disabled={chatting || !chatInput.trim()}
                  >{chatting ? "Sending…" : "Send"}</button>
                </div>
              </div>
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
  wrapper: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif"
  },
  fullscreenWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "#1e1e2f",
    zIndex: 2000,
    fontFamily: "'Inter', sans-serif"
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "1.5rem 2rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "0.5rem"
  },
  subHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem"
  },
  subtitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "600",
    opacity: 0.9
  },
  fileInfo: {
    background: "rgba(255,255,255,0.2)",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "500"
  },
  toolbar: {
    background: "white",
    padding: "1rem 2rem",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  toolbarMain: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "0.5rem"
  },
  toolbarSecondary: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    flexWrap: "wrap"
  },
  select: {
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    background: "white",
    fontWeight: "500",
    minWidth: "140px"
  },
  btnRun: {
    padding: "0.5rem 1.5rem",
    border: "none",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #43e97b, #38f9d7)",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  btnSave: {
    padding: "0.5rem 1.5rem",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    background: "white",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  btnSecondary: {
    padding: "0.5rem 1rem",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    background: "white",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  btnAI: {
    padding: "0.5rem 1rem",
    border: "1px solid #4a5568",
    borderRadius: "6px",
    background: "#2d3748",
    color: "white",
    fontWeight: "600",
    cursor: "pointer"
  },
  badge: {
    marginLeft: "1rem",
    padding: "0.25rem 0.75rem",
    background: "#48bb78",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  mobileMenuBtn: {
    padding: "0.5rem 1rem",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    background: "white",
    fontWeight: "500",
    cursor: "pointer"
  },
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000
  },
  mobileMenuPanel: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "90%",
    maxWidth: "400px",
    maxHeight: "80vh",
    overflow: "auto",
    zIndex: 1001,
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
  },
  mobileMenuHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #e2e8f0"
  },
  mobileMenuContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  mobileMenuItem: {
    padding: "1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "500",
    transition: "all 0.2s"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "4px"
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem",
    gap: "1.5rem",
    maxWidth: "1400px",
    margin: "0 auto"
  },
  editorSection: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden"
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#2d3748"
  },
  editorInfo: {
    display: "flex",
    gap: "0.5rem"
  },
  languageBadge: {
    background: "#667eea",
    color: "white",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  fileBadge: {
    background: "#edf2f7",
    color: "#4a5568",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  codeMirrorContainer: {
    border: "1px solid #e2e8f0"
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    color: "#718096"
  },
  ioSection: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden"
  },
  ioColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    padding: "1.5rem"
  },
  ioPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "1rem",
    border: "1px solid #cbd5e0",
    borderRadius: "8px",
    fontFamily: "monospace",
    fontSize: "0.875rem",
    resize: "vertical"
  },
  output: {
    background: "#1a202c",
    color: "#90ee90",
    padding: "1rem",
    borderRadius: "8px",
    minHeight: "120px",
    fontFamily: "monospace",
    fontSize: "0.875rem",
    overflow: "auto",
    whiteSpace: "pre-wrap"
  },
  chatSection: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden"
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    height: "600px"
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc"
  },
  chatContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  contextRow: {
    display: "flex",
    gap: "1rem",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e2e8f0",
    flexWrap: "wrap"
  },
  ck: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem"
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  chatMsg: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "1rem"
  },
  msgTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  msgRole: {
    fontSize: "0.875rem",
    fontWeight: "600",
    opacity: 0.7
  },
  msgBtn: {
    fontSize: "0.75rem",
    border: "1px solid #cbd5e0",
    background: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    cursor: "pointer"
  },
  msgBody: {
    whiteSpace: "pre-wrap",
    lineHeight: "1.5"
  },
  chatComposer: {
    borderTop: "1px solid #e2e8f0",
    padding: "1rem 1.5rem",
    display: "flex",
    gap: "0.75rem"
  },
  chatInput: {
    flex: 1,
    minHeight: "60px",
    padding: "0.75rem",
    border: "1px solid #cbd5e0",
    borderRadius: "8px",
    resize: "vertical",
    fontFamily: "inherit"
  },
  sendBtn: {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "8px",
    background: "#667eea",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    alignSelf: "flex-end"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000
  },
  modalBox: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    marginBottom: "1rem"
  },
  modalBtns: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem"
  }
};

