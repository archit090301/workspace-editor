    // routes/files.js
    const express = require("express");
    const router = express.Router();
    const pool = require("../db");
    const { ensureAuth } = require("../middleware/auth");

    // Get all files for a project
    router.get("/projects/:projectId/files", ensureAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
        `SELECT f.file_id, f.project_id, f.file_name, f.language_id, f.content,
                f.created_at, f.updated_at
            FROM files f
            JOIN projects p ON f.project_id = p.project_id
            WHERE f.project_id = ? AND p.user_id = ?`,
        [req.params.projectId, req.user.user_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch files" });
    }
    });

    // Create new file in a project
    router.post("/projects/:projectId/files", ensureAuth, async (req, res) => {
    const { file_name, language_id = 63 } = req.body;
    if (!file_name || !file_name.trim()) {
        return res.status(400).json({ error: "file_name is required" });
    }

    try {
        // Verify project ownership
        const [proj] = await pool.query(
        "SELECT project_id FROM projects WHERE project_id = ? AND user_id = ?",
        [req.params.projectId, req.user.user_id]
        );
        if (proj.length === 0) {
        return res.status(404).json({ error: "Project not found" });
        }

        const [result] = await pool.query(
        "INSERT INTO files (project_id, file_name, language_id, content) VALUES (?, ?, ?, ?)",
        [req.params.projectId, file_name.trim(), language_id, ""]
        );

        const [rows] = await pool.query(
        "SELECT * FROM files WHERE file_id = ?",
        [result.insertId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not create file" });
    }
    });

    // Get single file
    router.get("/files/:fileId", ensureAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
        `SELECT f.file_id, f.project_id, f.file_name, f.language_id, f.content,
                f.created_at, f.updated_at
            FROM files f
            JOIN projects p ON f.project_id = p.project_id
            WHERE f.file_id = ? AND p.user_id = ?`,
        [req.params.fileId, req.user.user_id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "File not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch file" });
    }
    });

    // Update file
    router.put("/files/:fileId", ensureAuth, async (req, res) => {
    const { content, language_id } = req.body;
    try {
        // Ownership check
        const [own] = await pool.query(
        `SELECT f.file_id FROM files f
            JOIN projects p ON f.project_id = p.project_id
            WHERE f.file_id = ? AND p.user_id = ?`,
        [req.params.fileId, req.user.user_id]
        );
        if (own.length === 0) return res.status(404).json({ error: "File not found" });

        await pool.query(
        `UPDATE files
            SET content = COALESCE(?, content),
                language_id = COALESCE(?, language_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE file_id = ?`,
        [content, language_id, req.params.fileId]
        );

        const [rows] = await pool.query("SELECT * FROM files WHERE file_id = ?", [
        req.params.fileId,
        ]);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not update file" });
    }
    });

    // Delete file
router.delete("/files/:fileId", ensureAuth, async (req, res) => {
  try {
    const [own] = await pool.query(
      `SELECT f.file_id FROM files f
         JOIN projects p ON f.project_id = p.project_id
        WHERE f.file_id = ? AND p.user_id = ?`,
      [req.params.fileId, req.user.user_id]
    );
    if (own.length === 0) return res.status(404).json({ error: "File not found" });

    await pool.query("DELETE FROM files WHERE file_id = ?", [req.params.fileId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete file" });
  }
});


    module.exports = router;
