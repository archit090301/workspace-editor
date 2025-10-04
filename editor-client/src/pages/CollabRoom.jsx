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

  const selfUpdating = useRef(false);
  const editorRef = useRef(null);

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

  return (
    <div style={{ display: "flex", height: "90vh", position: "relative" }}>
      {/* MAIN EDITOR */}
      <div style={{ flex: 3, padding: "1rem", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Room: {roomId}</h3>
          <span style={{ opacity: 0.7 }}>{status}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <select onChange={(e) => inviteFriend(e.target.value)} defaultValue="" style={select}>
              <option value="" disabled>
                Invite Friend…
              </option>
              {friends.map((f) => (
                <option key={f.user_id} value={f.user_id}>
                  {f.username}
                </option>
              ))}
            </select>

            <select value={language} onChange={onLanguageChange} style={select}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <button onClick={runCode} style={btnPrimary}>
              Run ▶
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(roomId)}
              style={btnSecondary}
            >
              Copy Code
            </button>
            <button onClick={leave} style={btnDanger}>
              Leave
            </button>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <CodeMirror
            ref={editorRef}
            value={code}
            height="60vh"
            theme={oneDark}
            extensions={[langExt[language] || javascript()]}
            onChange={onChange}
            onUpdate={onUpdate}
          />

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
              }}
              title={username}
            ></div>
          ))}
        </div>

        {typingUsers.length > 0 && (
          <div style={{ color: "#aaa", fontStyle: "italic", marginTop: "4px" }}>
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}

        <div style={outputBox}>
          <h4>Output</h4>
          <pre>{output}</pre>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          borderLeft: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
          <strong>👥 Users:</strong> {users.join(", ")}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: "0.5rem" }}>
              <strong>{m.username}:</strong> {m.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", borderTop: "1px solid #ddd" }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: "0.5rem" }}
          />
          <button onClick={sendMessage} style={btnPrimary}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const select = {
  padding: "0.5rem",
  borderRadius: 8,
  border: "1px solid #ccc",
};

const btnSecondary = {
  padding: "0.5rem 0.9rem",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "#f6f6f6",
  cursor: "pointer",
};

const btnDanger = {
  padding: "0.5rem 0.9rem",
  borderRadius: 8,
  border: "none",
  background: "#ef5350",
  color: "#fff",
  cursor: "pointer",
};

const btnPrimary = {
  padding: "0.5rem 0.9rem",
  borderRadius: 8,
  border: "none",
  background: "#4e54c8",
  color: "#fff",
  cursor: "pointer",
};

const outputBox = {
  marginTop: "1rem",
  background: "#111",
  color: "#0f0",
  padding: "1rem",
  borderRadius: 8,
  height: "20vh",
  overflowY: "auto",
};
