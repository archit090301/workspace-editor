import express from "express";
import axios from "axios";
import db from "../db.js";
import { ensureAuth } from "../middleware/auth.js";

const router = express.Router();

const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
};

router.post("/", ensureAuth, async (req, res) => {
  const { code, language, stdin, fileId } = req.body;
  const languageId = languageMap[language];

  if (!code || !languageId) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  try {
    const start = Date.now();

    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin || "",
      },
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    const result = submission.data;
    const duration = Date.now() - start;

    let combinedOutput = "";
    let status = "success";

    if (result.compile_output) {
      combinedOutput += `❌ Compilation error:\n${result.compile_output}\n`;
      status = "compile_error";
    }
    if (result.stderr) {
      combinedOutput += `⚠️ Runtime error:\n${result.stderr}\n`;
      status = "runtime_error";
    }
    if (result.stdout) {
      combinedOutput += `✅ Output:\n${result.stdout}`;
    }
    if (!combinedOutput) {
      combinedOutput = "No output";
      status = "no_output";
    }

    await db.query(
      `INSERT INTO executions 
       (user_id, file_id, content_executed, input, output, language, language_id, stderr, compile_output, exit_code, status, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        fileId || null,
        code,
        stdin || null,
        combinedOutput,
        language,
        languageId,
        result.stderr || null,
        result.compile_output || null,
        typeof result.exit_code === "number" ? result.exit_code : null,
        status,
        duration,
      ]
    );

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      exit_code: result.exit_code,
      status,
      output: combinedOutput,
    });
  } catch (err) {
    console.error("❌ Judge0 error:", err.response?.data || err.message);
    res.status(500).json({ error: "Execution failed" });
  }
});

router.get("/history", ensureAuth, async (req, res) => {
  const { fileId, scratchpad, limit = 20 } = req.query;

  try {
    let query = `SELECT execution_id, file_id, language, status, duration_ms, timestamp, output
                   FROM executions
                  WHERE user_id = ?`;
    const params = [req.user.user_id];

    if (fileId) {
      query += " AND file_id = ?";
      params.push(fileId);
    } else if (scratchpad === "true") {
      query += " AND file_id IS NULL";
    }

    query += " ORDER BY execution_id DESC LIMIT ?";
    params.push(Number(limit));

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ History fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.get("/history/:id", ensureAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM executions WHERE execution_id = ? AND user_id = ?",
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ History detail error:", err.message);
    res.status(500).json({ error: "Failed to fetch execution detail" });
  }
});

export default router;
