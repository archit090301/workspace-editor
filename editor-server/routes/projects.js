import express from "express";
import db from "../db.js";
import { ensureAuth } from "../middleware/auth.js";

const router = express.Router();

// --------------------------------------------------
// GET USER PROJECTS (FILTER OUT DELETED)
// --------------------------------------------------
router.get("/", ensureAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT project_id,
              project_name,
              description,
              language,
              created_at,
              updated_at,
              moderation_status
         FROM projects
        WHERE user_id = ?
          AND is_deleted = 0
        ORDER BY updated_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch projects error:", err.message);
    res.status(500).json({ error: "Could not fetch projects" });
  }
});

// --------------------------------------------------
// CREATE PROJECT
// --------------------------------------------------
router.post("/", ensureAuth, async (req, res) => {
  const {
    project_name,
    description = null,
    content = null,
    language = "javascript",
  } = req.body;

  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: "project_name is required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO projects (user_id, project_name, description, content, language)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, project_name.trim(), description, content, language]
    );

    const [rows] = await db.query(
      `SELECT project_id, project_name, description, content, language, created_at, updated_at, moderation_status
         FROM projects
        WHERE project_id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Create project error:", err.message);
    res.status(500).json({ error: "Could not create project" });
  }
});

// --------------------------------------------------
// DELETE PROJECT (SOFT DELETE)
// --------------------------------------------------
router.delete("/:projectId", ensureAuth, async (req, res) => {
  try {
    const [proj] = await db.query(
      "SELECT * FROM projects WHERE project_id = ? AND user_id = ? AND is_deleted = 0",
      [req.params.projectId, req.user.user_id]
    );

    if (proj.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Optional: delete files – keep if you want
    await db.query("DELETE FROM files WHERE project_id = ?", [req.params.projectId]);

    // Soft delete main project
    await db.query(
      "UPDATE projects SET is_deleted = 1 WHERE project_id = ?",
      [req.params.projectId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete project error:", err.message);
    res.status(500).json({ error: "Could not delete project" });
  }
});

// --------------------------------------------------
// GET SPECIFIC PROJECT (FILTER OUT DELETED)
// --------------------------------------------------
router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT project_id, project_name, description, content, language, created_at, updated_at, moderation_status
         FROM projects
        WHERE project_id = ? 
          AND user_id = ?
          AND is_deleted = 0`,
      [req.params.id, req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Fetch project error:", err.message);
    res.status(500).json({ error: "Could not fetch project" });
  }
});

// --------------------------------------------------
// UPDATE PROJECT
// --------------------------------------------------
router.put("/:id", ensureAuth, async (req, res) => {
  const { project_name, description, content, language } = req.body;

  try {
    const [own] = await db.query(
      "SELECT project_id FROM projects WHERE project_id = ? AND user_id = ? AND is_deleted = 0",
      [req.params.id, req.user.user_id]
    );

    if (own.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    await db.query(
      `UPDATE projects
          SET project_name = COALESCE(?, project_name),
              description  = COALESCE(?, description),
              content      = COALESCE(?, content),
              language     = COALESCE(?, language),
              updated_at   = CURRENT_TIMESTAMP
        WHERE project_id = ?`,
      [project_name, description, content, language, req.params.id]
    );

    const [rows] = await db.query(
      `SELECT project_id, project_name, description, content, language, created_at, updated_at, moderation_status
         FROM projects
        WHERE project_id = ?`,
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Update project error:", err.message);
    res.status(500).json({ error: "Could not update project" });
  }
});

// --------------------------------------------------
// GET FILES FOR PROJECT
// --------------------------------------------------
router.get("/:id/files", ensureAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.file_id, f.file_name, f.language_id, f.created_at, f.updated_at
         FROM files f
         JOIN projects p ON f.project_id = p.project_id
        WHERE f.project_id = ? 
          AND p.user_id = ?
          AND p.is_deleted = 0`,
      [req.params.id, req.user.user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch project files error:", err.message);
    res.status(500).json({ error: "Could not fetch files for this project" });
  }
});

export default router;
