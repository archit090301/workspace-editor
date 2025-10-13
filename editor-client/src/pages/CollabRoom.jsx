import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import debounce from "lodash.debounce";
import { useAuth } from "../AuthContext";
import api from "../api";

const langExt = {
  javascript: javascript(),
  python: python(),
  java: java(),
  cpp: cpp(),
};

const cursorColors = ["#ff5555", "#50fa7b", "#8be9fd", "#ffb86c", "#bd93f9"];

export default function CollabRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [code, setCode] = useState("// connecting…");
  const [language, setLanguage] = useState("javascript");
  const [status, setStatus] = useState("Connecting…");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState("");
  const [friends, setFriends] = useState([]);

  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);

  // Mobile states
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [showChat, setShowChat] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const selfUpdating = useRef(false);
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowChat(false);
        setShowUsers(false);
        setShowMobileMenu(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await api.get("/friends");
        const accepted = res.data.filter((f) => f.status === "accepted");
        setFriends(accepted);
      } catch {
        console.warn("Failed to load friends");
      }
    };
    loadFriends();
  }, []);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("collab:join_room", { roomId, username: user?.username }, (resp) => {
      if (!resp?.ok) {
        setStatus(resp?.error || "Join failed");
        return;
      }
      setCode(resp.state.code);
      setLanguage(resp.state.language);
      setUsers(resp.state.users);
      setStatus(`Room ${roomId}`);
    });

    socket.on("collab:code_change", ({ code }) => {
      selfUpdating.current = true;
      setCode(code);
      setTimeout(() => (selfUpdating.current = false), 0);
    });

    socket.on("collab:language_change", ({ language }) => setLanguage(language));
    socket.on("collab:user_list", (list) => setUsers(list));
    socket.on("collab:message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("collab:run_result", ({ output }) => setOutput(output));

    // 🧑‍🤝‍🧑 Presence: cursors & typing
    socket.on("collab:cursor", ({ socketId, username, position }) => {
      setCursors((prev) => ({ ...prev, [socketId]: { username, position } }));
    });

    socket.on("collab:typing", ({ username, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping
          ? [...new Set([...prev, username])]
          : prev.filter((u) => u !== username)
      );
    });

    return () => {
      socket.off("collab:code_change");
      socket.off("collab:language_change");
      socket.off("collab:user_list");
      socket.off("collab:message");
      socket.off("collab:run_result");
      socket.off("collab:cursor");
      socket.off("collab:typing");
    };
  }, [roomId, user?.username]);

  const emitChange = useRef(
    debounce((nextCode) => socket.emit("collab:code_change", { roomId, code: nextCode }), 80)
  ).current;

  const onChange = (next) => {
    setCode(next);
    if (!selfUpdating.current) emitChange(next);

    socket.emit("collab:typing", { roomId, isTyping: true });
    clearTimeout(window._typingTimeout);
    window._typingTimeout = setTimeout(() => {
      socket.emit("collab:typing", { roomId, isTyping: false });
    }, 1500);
  };

  const onUpdate = (viewUpdate) => {
    const pos = viewUpdate.state.selection.main.head;
    socket.emit("collab:cursor", { roomId, position: pos });
  };

  const onLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    socket.emit("collab:language_change", { roomId, language: lang });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket.emit("collab:message", { roomId, text: chatInput.trim() });
    setChatInput("");
  };

  const runCode = () => {
    socket.emit("collab:run_code", { roomId, code, language });
    setOutput("Running...");
  };

  const inviteFriend = (friendId) => {
    if (!friendId) return;
    socket.emit("collab:invite_friend", {
      fromUser: user.username,
      toUserId: friendId,
      roomId,
    });
    alert("Invitation sent ✅");
  };

  const leave = () => navigate("/collab");

  // Mobile menu actions
  const handleMobileMenuAction = (action) => {
    setShowMobileMenu(false);
    switch (action) {
      case 'invite': 
        const friendSelect = document.getElementById('friend-select');
        if (friendSelect?.value) inviteFriend(friendSelect.value);
        break;
      case 'chat': setShowChat(true); break;
      case 'users': setShowUsers(true); break;
      case 'copy': navigator.clipboard.writeText(roomId); break;
      case 'run': runCode(); break;
      default: break;
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={styles.mobileMenuBtn}
          >
            ☰ Menu
          </button>
          <div style={styles.mobileTitle}>
            <div style={styles.roomTitle}>Room: {roomId}</div>
            <div style={styles.status}>{status}</div>
          </div>
          <div style={styles.mobileHeaderActions}>
            <button 
              onClick={() => setShowChat(true)}
              style={styles.mobileIconBtn}
              title="Chat"
            >
              💬
            </button>
            <button 
              onClick={() => setShowUsers(true)}
              style={styles.mobileIconBtn}
              title="Users"
            >
              👥
            </button>
          </div>
        </div>
      )}

      <div style={{
        ...styles.container,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* MAIN EDITOR */}
        <div style={isMobile ? styles.mobileEditorSection : styles.editorSection}>
          {/* Desktop Header */}
          {!isMobile && (
            <div style={styles.header}>
              <div style={styles.headerInfo}>
                <h3 style={styles.roomTitle}>Room: {roomId}</h3>
                <span style={styles.status}>{status}</span>
              </div>
              
              <div style={styles.headerActions}>
                <select 
                  onChange={(e) => inviteFriend(e.target.value)} 
                  defaultValue="" 
                  style={styles.select}
                  id="friend-select"
                >
                  <option value="" disabled>Invite Friend…</option>
                  {friends.map((f) => (
                    <option key={f.user_id} value={f.user_id}>
                      {f.username}
                    </option>
                  ))}
                </select>

                <select value={language} onChange={onLanguageChange} style={styles.select}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <button onClick={runCode} style={styles.btnPrimary}>
                  Run ▶
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(roomId)}
                  style={styles.btnSecondary}
                >
                  Copy Code
                </button>
                <button onClick={leave} style={styles.btnDanger}>
                  Leave
                </button>
              </div>
            </div>
          )}

          {/* Editor with Cursors */}
          <div style={styles.editorContainer}>
            <CodeMirror
              ref={editorRef}
              value={code}
              height={isMobile ? "50vh" : "60vh"}
              theme={oneDark}
              extensions={[langExt[language] || javascript()]}
              onChange={onChange}
              onUpdate={onUpdate}
            />

            {/* Cursor Overlays */}
            {Object.entries(cursors).map(([id, { username, position }], index) => (
              <div
                key={id}
                style={{
                  position: "absolute",
                  top: `${position * 0.25}px`,
                  left: "4px",
                  width: "2px",
                  height: "1em",
                  background: cursorColors[index % cursorColors.length],
                  zIndex: 10,
                }}
                title={username}
              ></div>
            ))}
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div style={styles.typingIndicator}>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </div>
          )}

          {/* Output */}
          <div style={styles.outputBox}>
            <h4 style={styles.outputTitle}>Output</h4>
            <pre style={styles.outputText}>{output}</pre>
          </div>
        </div>

        {/* CHAT & USERS PANEL - Desktop */}
        {!isMobile && (
          <div style={styles.sidePanel}>
            {/* Users List */}
            <div style={styles.usersSection}>
              <h4 style={styles.sidePanelTitle}>👥 Online Users ({users.length})</h4>
              <div style={styles.usersList}>
                {users.map((user, index) => (
                  <div key={index} style={styles.userItem}>
                    <span 
                      style={{
                        ...styles.userColor,
                        background: cursorColors[index % cursorColors.length]
                      }}
                    ></span>
                    {user}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div style={styles.chatSection}>
              <h4 style={styles.sidePanelTitle}>💬 Chat</h4>
              <div style={styles.messagesContainer}>
                {messages.map((m, i) => (
                  <div key={i} style={styles.message}>
                    <strong style={styles.messageUser}>{m.username}:</strong> 
                    <span style={styles.messageText}>{m.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div style={styles.chatInputContainer}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  style={styles.chatInput}
                />
                <button onClick={sendMessage} style={styles.chatSendBtn}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CHAT MODAL */}
      {isMobile && showChat && (
        <div style={styles.mobileOverlay} onClick={() => setShowChat(false)}>
          <div style={styles.mobilePanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobilePanelHeader}>
              <h3>💬 Chat</h3>
              <button onClick={() => setShowChat(false)} style={styles.closeBtn}>✖</button>
            </div>
            <div style={styles.mobileMessages}>
              {messages.map((m, i) => (
                <div key={i} style={styles.message}>
                  <strong style={styles.messageUser}>{m.username}:</strong> 
                  <span style={styles.messageText}>{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={styles.mobileChatInput}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                style={styles.mobileInput}
              />
              <button onClick={sendMessage} style={styles.mobileSendBtn}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE USERS MODAL */}
      {isMobile && showUsers && (
        <div style={styles.mobileOverlay} onClick={() => setShowUsers(false)}>
          <div style={styles.mobilePanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobilePanelHeader}>
              <h3>👥 Online Users ({users.length})</h3>
              <button onClick={() => setShowUsers(false)} style={styles.closeBtn}>✖</button>
            </div>
            <div style={styles.mobileUsersList}>
              {users.map((user, index) => (
                <div key={index} style={styles.mobileUserItem}>
                  <span 
                    style={{
                      ...styles.userColor,
                      background: cursorColors[index % cursorColors.length]
                    }}
                  ></span>
                  {user}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU MODAL */}
      {isMobile && showMobileMenu && (
        <div style={styles.mobileOverlay} onClick={() => setShowMobileMenu(false)}>
          <div style={styles.mobileMenuPanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobilePanelHeader}>
              <h3>Room Actions</h3>
              <button onClick={() => setShowMobileMenu(false)} style={styles.closeBtn}>✖</button>
            </div>
            
            <div style={styles.mobileMenuSection}>
              <h4 style={styles.mobileMenuTitle}>Invite Friends</h4>
              <select 
                onChange={(e) => inviteFriend(e.target.value)} 
                defaultValue="" 
                style={styles.mobileSelect}
                id="mobile-friend-select"
              >
                <option value="" disabled>Select a friend...</option>
                {friends.map((f) => (
                  <option key={f.user_id} value={f.user_id}>
                    {f.username}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => handleMobileMenuAction('invite')}
                style={styles.mobileMenuItem}
              >
                📨 Send Invite
              </button>
            </div>

            <div style={styles.mobileMenuSection}>
              <h4 style={styles.mobileMenuTitle}>Language</h4>
              <select 
                value={language} 
                onChange={onLanguageChange} 
                style={styles.mobileSelect}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div style={styles.mobileMenuActions}>
              <button onClick={runCode} style={styles.mobileActionBtn}>
                ▶ Run Code
              </button>
              <button 
                onClick={() => navigator.clipboard.writeText(roomId)}
                style={styles.mobileActionBtn}
              >
                📋 Copy Room Code
              </button>
              <button onClick={leave} style={styles.mobileDangerBtn}>
                🚪 Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    height: '100vh',
    background: '#1e1e1e',
    color: 'white',
    fontFamily: "'Inter', sans-serif",
  },
  mobileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    borderBottom: '1px solid #333',
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
  mobileIconBtn: {
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    marginLeft: '0.5rem',
  },
  mobileTitle: {
    flex: 1,
    textAlign: 'center',
  },
  mobileHeaderActions: {
    display: 'flex',
  },
  container: {
    display: 'flex',
    height: 'calc(100vh - 70px)',
  },
  editorSection: {
    flex: 3,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileEditorSection: {
    flex: 1,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roomTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  status: {
    opacity: 0.8,
    fontSize: '0.9rem',
  },
  editorContainer: {
    position: 'relative',
    flex: 1,
    marginBottom: '0.5rem',
  },
  typingIndicator: {
    color: '#aaa',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    padding: '0 0.5rem',
  },
  outputBox: {
    background: '#111',
    borderRadius: '8px',
    padding: '1rem',
    minHeight: '150px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  outputTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    color: '#e2e8f0',
  },
  outputText: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    whiteSpace: 'pre-wrap',
    color: '#90ee90',
    lineHeight: '1.4',
  },
  sidePanel: {
    flex: 1,
    borderLeft: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '300px',
  },
  usersSection: {
    borderBottom: '1px solid #333',
    padding: '1rem',
  },
  sidePanelTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    color: '#e2e8f0',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    background: '#2d2d2d',
    borderRadius: '6px',
  },
  userColor: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  chatSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
  },
  message: {
    marginBottom: '0.75rem',
    padding: '0.5rem',
    background: '#2d2d2d',
    borderRadius: '6px',
  },
  messageUser: {
    color: '#8be9fd',
    marginRight: '0.5rem',
  },
  messageText: {
    color: '#f8f8f2',
  },
  chatInputContainer: {
    display: 'flex',
    borderTop: '1px solid #333',
    padding: '1rem',
  },
  chatInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #444',
    borderRadius: '6px',
    background: '#2d2d2d',
    color: 'white',
    marginRight: '0.5rem',
  },
  chatSendBtn: {
    padding: '0.75rem 1.5rem',
    background: '#4e54c8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  // Mobile Modals
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
  },
  mobilePanel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#2d2d2d',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflow: 'hidden',
    zIndex: 1001,
  },
  mobileMenuPanel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#2d2d2d',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 1001,
    padding: '1.5rem',
  },
  mobilePanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #444',
    background: '#363636',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
  },
  mobileMessages: {
    height: '400px',
    overflowY: 'auto',
    padding: '1rem',
  },
  mobileUsersList: {
    padding: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  mobileUserItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: '#363636',
    borderRadius: '8px',
    marginBottom: '0.5rem',
  },
  mobileChatInput: {
    display: 'flex',
    padding: '1rem',
    borderTop: '1px solid #444',
  },
  mobileInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #555',
    borderRadius: '6px',
    background: '#363636',
    color: 'white',
    marginRight: '0.5rem',
  },
  mobileSendBtn: {
    padding: '0.75rem 1rem',
    background: '#4e54c8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  // Mobile Menu Styles
  mobileMenuSection: {
    marginBottom: '1.5rem',
  },
  mobileMenuTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    color: '#e2e8f0',
  },
  mobileSelect: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #555',
    borderRadius: '6px',
    background: '#363636',
    color: 'white',
    marginBottom: '0.75rem',
  },
  mobileMenuItem: {
    width: '100%',
    padding: '1rem',
    background: '#4e54c8',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    marginBottom: '0.5rem',
  },
  mobileMenuActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  mobileActionBtn: {
    padding: '1rem',
    background: '#4e54c8',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  mobileDangerBtn: {
    padding: '1rem',
    background: '#ef5350',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  // Form Controls
  select: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #555',
    background: '#2d2d2d',
    color: 'white',
    minWidth: '140px',
  },
  btnPrimary: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: '#4e54c8',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
  },
  btnSecondary: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #555',
    background: '#2d2d2d',
    color: '#fff',
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: '#ef5350',
    color: '#fff',
    cursor: 'pointer',
  },
};
