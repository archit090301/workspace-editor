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

  // Mobile states
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const dragIndex = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
        setShowMobileMenu(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;



  const openFile = async (file) => {
    try {
      const existing = openTabs.find((t) => t.file_id === file.file_id);
      if (existing) {
        setActiveTabId(file.file_id);
        setActiveFile(existing);
        setCode(existing.content ?? "// empty file");
        setLanguage(idToLanguage[existing.language_id] || "javascript");
        if (isMobile) setSidebarOpen(false);
        return;
      }

      const { data } = await api.get(`/files/${file.file_id}`);
      const newTab = { ...data, content: data.content ?? "// empty file" };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabId(file.file_id);
      setActiveFile(newTab);
      setCode(newTab.content);
      setLanguage(idToLanguage[newTab.language_id] || "javascript");
      if (isMobile) setSidebarOpen(false);
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
        content: code,
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

  // Mobile menu actions
  const handleMobileMenuAction = (action) => {
    setShowMobileMenu(false);
    switch (action) {
      case 'save': handleSave(); break;
      case 'export': handleExport(); break;
      case 'import': document.querySelector('input[type="file"]').click(); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'history': loadHistory(); break;
      case 'delete': activeFile && deleteFile(activeFile.file_id); break;
      default: break;
    }
  };

  return (
    <div style={isFullscreen ? styles.fullscreenWrapper : styles.wrapper}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.mobileMenuBtn}
          >
            ☰ Files
          </button>
          <span style={styles.mobileTitle}>
            {activeFile ? activeFile.file_name : "Project Editor"}
          </span>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={styles.mobileMenuBtn}
          >
            ⋮ Tools
          </button>
        </div>
      )}

      <div style={styles.container}>
        {/* Sidebar */}
        <div style={{
          ...styles.sidebar,
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          position: isMobile ? 'fixed' : 'relative',
          zIndex: isMobile ? 1000 : 1,
          height: isMobile ? '100vh' : 'auto',
        }}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Project Files</h3>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                style={styles.closeBtn}
              >
                ✖
              </button>
            )}
          </div>
          
          <div style={styles.fileList}>
            {files.map((f) => (
              <button
                key={f.file_id}
                style={{
                  ...styles.fileButton,
                  background: activeFile?.file_id === f.file_id ? '#4e54c8' : '#f8fafc',
                  color: activeFile?.file_id === f.file_id ? '#fff' : '#333',
                }}
                onClick={() => openFile(f)}
              >
                <span style={styles.fileName}>{f.file_name}</span>
                {activeFile?.file_id === f.file_id && (
                  <span style={styles.activeIndicator}>●</span>
                )}
              </button>
            ))}
          </div>

          <div style={styles.newFileSection}>
            <input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="New file name"
              style={styles.newFileInput}
              onKeyPress={(e) => e.key === 'Enter' && createFile()}
            />
            <button onClick={createFile} style={styles.createButton}>
              + Create File
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            style={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Tabs */}
          {openTabs.length > 0 && (
            <div style={styles.tabsContainer}>
              <div style={styles.tabsScroll}>
                {openTabs.map((tab, i) => (
                  <div
                    key={tab.file_id}
                    draggable={!isMobile}
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
                      ...styles.tab,
                      background: tab.file_id === activeTabId ? '#4e54c8' : '#e2e8f0',
                      color: tab.file_id === activeTabId ? '#fff' : '#4a5568',
                    }}
                  >
                    <span style={styles.tabName}>{tab.file_name}</span>
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
                      style={styles.tabClose}
                      title="Close tab"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div style={styles.editorArea}>
            {activeFile ? (
              <>
                {/* Toolbar */}
                <div style={styles.toolbar}>
                  <div style={styles.toolbarMain}>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      style={styles.languageSelect}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>

                    <button onClick={handleRun} disabled={running} style={styles.btnPrimary}>
                      {running ? "Running..." : "▶ Run"}
                    </button>
                    <button onClick={handleSave} disabled={saving} style={styles.btnSecondary}>
                      {saving ? "Saving..." : "💾 Save"}
                    </button>

                    {/* Secondary tools - hidden in mobile menu */}
                    {(!isMobile || showMobileMenu) && (
                      <div style={isMobile ? styles.mobileToolsMenu : styles.toolbarSecondary}>
                        <button onClick={handleExport} style={styles.btnSecondary}>⬇ Export</button>
                        <label style={styles.btnSecondary}>
                          ⬆ Import
                          <input type="file" accept=".js,.py,.java,.cpp,.txt" onChange={handleImport} style={{ display: "none" }} />
                        </label>
                        <button onClick={toggleFullscreen} style={styles.btnSecondary}>
                          {isFullscreen ? "🗕 Exit FS" : "🗖 Fullscreen"}
                        </button>
                        <button onClick={loadHistory} style={styles.btnSecondary}>📜 History</button>
                        <button
                          onClick={() => deleteFile(activeFile.file_id)}
                          style={{ ...styles.btnSecondary, background: '#e53e3e', color: 'white' }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                    
                    {saveMsg && <span style={styles.saveMessage}>{saveMsg}</span>}
                  </div>
                </div>

                {/* Code Editor */}
                <div style={styles.editorContainer}>
                  <CodeMirror
                    value={code}
                    height={isMobile ? "50vh" : "60vh"}
                    theme={editorTheme}
                    extensions={getExtensions()}
                    onChange={(val) => {
                      setCode(val);
                      setOpenTabs((prev) =>
                        prev.map((t) => (t.file_id === activeTabId ? { ...t, content: val } : t))
                      );
                    }}
                  />
                </div>

                {/* Output */}
                <div style={styles.outputContainer}>
                  <h4 style={styles.outputTitle}>Output</h4>
                  <pre style={styles.output}>
                    {output || "Run your code to see output here..."}
                  </pre>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <h3>Select a file to start editing</h3>
                <p>Choose a file from the sidebar or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tools Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div style={styles.overlay} onClick={() => setShowMobileMenu(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileMenuHeader}>
              <h3>Tools</h3>
              <button onClick={() => setShowMobileMenu(false)} style={styles.closeBtn}>✖</button>
            </div>
            <div style={styles.mobileMenuItems}>
              <button onClick={() => handleMobileMenuAction('export')} style={styles.mobileMenuItem}>
                ⬇ Export Code
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
              <button onClick={() => handleMobileMenuAction('delete')} style={styles.mobileMenuItem}>
                🗑 Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3>📜 Execution History</h3>
            <div style={styles.historyList}>
              {history.map((h) => (
                <div
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
                  style={styles.historyItem}
                >
                  <div style={styles.historyHeader}>
                    <strong>{h.language}</strong>
                    <span style={styles.historyStatus}>{h.status}</span>
                  </div>
                  <div style={styles.historyTime}>
                    {new Date(h.timestamp).toLocaleString()}
                  </div>
                  <small style={styles.historyHint}>Click to load</small>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHistory(false)} style={styles.btnSecondary}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
  },
  fullscreenWrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#1e1e2f',
    zIndex: 2000,
    fontFamily: "'Inter', sans-serif",
  },
  mobileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mobileMenuBtn: {
    padding: '0.5rem 1rem',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  mobileTitle: {
    fontWeight: '600',
    fontSize: '1rem',
    textAlign: 'center',
    flex: 1,
    margin: '0 1rem',
  },
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
  },
  sidebar: {
    width: '280px',
    background: 'white',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#718096',
    padding: '0.25rem',
    borderRadius: '4px',
  },
  fileList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem',
  },
  fileButton: {
    width: '100%',
    border: '1px solid #e2e8f0',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    marginBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  activeIndicator: {
    color: 'inherit',
    fontSize: '1.2rem',
  },
  newFileSection: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  newFileInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    marginBottom: '0.75rem',
    fontSize: '0.9rem',
  },
  createButton: {
    width: '100%',
    padding: '0.75rem',
    background: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    overflow: 'hidden',
  },
  tabsContainer: {
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  tabsScroll: {
    display: 'flex',
    overflowX: 'auto',
    padding: '0.5rem',
    gap: '0.25rem',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    userSelect: 'none',
    minWidth: '120px',
    transition: 'all 0.2s',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  tabName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  tabClose: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '8px',
    fontSize: '1.1rem',
    opacity: 0.7,
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toolbar: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  toolbarMain: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  languageSelect: {
    padding: '0.5rem',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    background: 'white',
    fontWeight: '500',
    minWidth: '140px',
  },
  btnPrimary: {
    padding: '0.5rem 1.5rem',
    background: '#4e54c8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  btnSecondary: {
    padding: '0.5rem 1rem',
    background: 'white',
    color: '#4a5568',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  toolbarSecondary: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  saveMessage: {
    padding: '0.5rem 1rem',
    background: '#48bb78',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  editorContainer: {
    flex: 1,
    borderBottom: '1px solid #e2e8f0',
  },
  outputContainer: {
    padding: '1rem',
    background: '#1a202c',
    color: '#90ee90',
    maxHeight: '30vh',
    overflow: 'auto',
  },
  outputTitle: {
    margin: '0 0 0.75rem 0',
    color: '#e2e8f0',
    fontSize: '1rem',
  },
  output: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#718096',
    textAlign: 'center',
    padding: '2rem',
  },
  mobileToolsMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mobileMenu: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '90%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 1000,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  mobileMenuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0',
  },
  mobileMenuItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mobileMenuItem: {
    padding: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalBox: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  historyList: {
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '1.5rem',
  },
  historyItem: {
    padding: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#f8fafc',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  historyStatus: {
    fontSize: '0.875rem',
    color: '#718096',
    background: '#edf2f7',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
  },
  historyTime: {
    fontSize: '0.875rem',
    color: '#718096',
    marginBottom: '0.25rem',
  },
  historyHint: {
    color: '#4e54c8',
    fontSize: '0.75rem',
  },
};
