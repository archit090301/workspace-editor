// src/pages/ProjectEditor.jsx
import { useAuth } from "../AuthContext";
import { Navigate, useParams, useSearchParams } from "react-router-dom"; // ⭐ added useSearchParams
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
  const [searchParams] = useSearchParams(); // ⭐ read ?file= from URL

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

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  // Fetch all files in this project
  useEffect(() => {
    api.get(`/projects/${projectId}/files`)
      .then((res) => setFiles(res.data))
      .catch((err) => console.error(err));
  }, [projectId]);

  // ⭐ Auto-open file if ?file= is present
  useEffect(() => {
    const fileId = searchParams.get("file");
    if (fileId) {
      api.get(`/files/${fileId}`)
        .then((res) => {
          const data = res.data;
          setActiveFile(data);
          setCode(data.content ?? "// empty file");
          setLanguage(idToLanguage[data.language_id] || "javascript");
        })
        .catch(console.error);
    }
  }, [searchParams]);

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

  // Create a new file in project
  const createFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const { data } = await api.post(`/projects/${projectId}/files`, {
        file_name: newFileName,
        language_id: dbLanguageMap.javascript,
      });
      setFiles([...files, data]);
      setNewFileName("");
      openFile(data); // open new file immediately
    } catch (err) {
      console.error(err);
      alert("Could not create file");
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

  // Save active file
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
      {/* Sidebar with files */}
      <div style={{ width: "220px", borderRight: "1px solid #ddd", padding: "1rem" }}>
        <h3>Files in Project {projectId}</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((f) => (
            <li key={f.file_id}>
              <button
                style={{
                  background: activeFile?.file_id === f.file_id ? "#4e54c8" : "transparent",
                  color: activeFile?.file_id === f.file_id ? "#fff" : "#333",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px 8px",
                  marginBottom: "4px",
                  width: "100%",
                  textAlign: "left",
                  borderRadius: "4px",
                }}
                // ⭐ navigate with ?file=
                onClick={() => window.location.href = `/projects/${projectId}?file=${f.file_id}`}
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
      <div style={{ flex: 1, padding: "1rem" }}>
        <h2>
          {activeFile
            ? `Editing ${activeFile.file_name}`
            : "Select a file to start editing"}
        </h2>

        {activeFile && (
          <>
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <label>Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
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

              {saveMsg && <span>{saveMsg}</span>}
            </div>

            <CodeMirror
              value={code}
              height="60vh"
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
