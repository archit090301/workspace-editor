import express from "express";
import db from "../db.js";

const router = express.Router();

function isAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.role_id === 2) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Admins only" });
}

// ---- Existing routes ----

router.get("/stats", isAdmin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [projects] = await db.query("SELECT COUNT(*) AS count FROM projects");
    const [files] = await db.query("SELECT COUNT(*) AS count FROM files");
    const [executions] = await db.query("SELECT COUNT(*) AS count FROM executions");

    res.json({
      users: users[0].count,
      projects: projects[0].count,
      files: files[0].count,
      executions: executions[0]?.count || 0,
    });
  } catch (err) {
    console.error("❌ Failed to fetch stats:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, username, email, role_id, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put("/promote/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await db.query("UPDATE users SET role_id = 2 WHERE user_id = ?", [userId]);
    res.json({ success: true, message: "User promoted to admin ✅" });
  } catch (err) {
    console.error("❌ Failed to promote user:", err.message);
    res.status(500).json({ error: "Failed to promote user" });
  }
});

router.get("/activity", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.username, 'Project created' AS action, p.created_at AS created_at
      FROM projects p
      JOIN users u ON p.user_id = u.user_id

      UNION ALL

      SELECT u.username, 'File uploaded' AS action, f.created_at AS created_at
      FROM files f
      JOIN projects p ON f.project_id = p.project_id
      JOIN users u ON p.user_id = u.user_id

      UNION ALL

      SELECT u.username, 'Code executed' AS action, e.timestamp AS created_at
      FROM executions e
      JOIN users u ON e.user_id = u.user_id

      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch activity:", err.message);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// ========================= PROJECT MODERATION =========================

// Get all projects for moderation
router.get("/projects", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.project_id,
        p.project_name AS title,
        p.description,
        u.username,
        p.created_at,
        'pending' AS moderation_status
      FROM projects p
      JOIN users u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch projects:", err.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Approve a project
router.put("/projects/:id/approve", isAdmin, async (req, res) => {
  try {
    await db.query(
      "UPDATE projects SET moderation_status = 'approved' WHERE project_id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: "Project approved ✅" });
  } catch (err) {
    console.error("❌ Failed to approve project:", err.message);
    res.status(500).json({ error: "Failed to approve project" });
  }
});

// Reject a project
router.put("/projects/:id/reject", isAdmin, async (req, res) => {
  try {
    await db.query(
      "UPDATE projects SET moderation_status = 'rejected' WHERE project_id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: "Project rejected ❌" });
  } catch (err) {
    console.error("❌ Failed to reject project:", err.message);
    res.status(500).json({ error: "Failed to reject project" });
  }
});

// Delete a project
router.delete("/projects/:id", isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE project_id = ?", [req.params.id]);
    res.json({ success: true, message: "Project deleted 🗑️" });
  } catch (err) {
    console.error("❌ Failed to delete project:", err.message);
    res.status(500).json({ error: "Failed to delete project" });
  }
});


export default router;
