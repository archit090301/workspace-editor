import express from "express";
import db from "../db.js";

const router = express.Router();

// Admin-only middleware
function isAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.role_id === 2) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Admins only" });
}

// -----------------------------------------------------
//  STATS
// -----------------------------------------------------
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [projects] = await db.query("SELECT COUNT(*) AS count FROM projects WHERE is_deleted = 0");
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

// -----------------------------------------------------
//  USERS
// -----------------------------------------------------
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
    const targetId = req.params.id;
    const adminId = req.user.user_id;

    await db.query("UPDATE users SET role_id = 2 WHERE user_id = ?", [targetId]);

    await db.query(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [adminId, `Promoted user #${targetId} to admin`]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to promote user:", err.message);
    res.status(500).json({ error: "Failed to promote user" });
  }
});

// -----------------------------------------------------
//  ACTIVITY FEED
// -----------------------------------------------------
router.get("/activity", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.action, a.created_at, u.username
      FROM activity_logs a
      JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
      LIMIT 30
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch activity:", err.message);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// -----------------------------------------------------
//  PROJECT MODERATION
// -----------------------------------------------------

// Get all projects for admin dashboard
router.get("/projects", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.project_id,
        p.project_name AS title,
        p.description,
        p.moderation_status,
        p.created_at,
        u.username
      FROM projects p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_deleted = 0
      ORDER BY p.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch projects:", err.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Approve project
router.put("/projects/:id/approve", isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const adminId = req.user.user_id;

    await db.query(`
      UPDATE projects
      SET moderation_status = 'approved',
          moderated_by = ?,
          moderated_at = NOW()
      WHERE project_id = ?
    `, [adminId, id]);

    await db.query(`
      INSERT INTO activity_logs (user_id, action)
      VALUES (?, ?)
    `, [adminId, `Approved project #${id}`]);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to approve project:", err.message);
    res.status(500).json({ error: "Failed to approve project" });
  }
});

// Reject project
router.put("/projects/:id/reject", isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const adminId = req.user.user_id;

    await db.query(`
      UPDATE projects
      SET moderation_status = 'rejected',
          moderated_by = ?,
          moderated_at = NOW()
      WHERE project_id = ?
    `, [adminId, id]);

    await db.query(`
      INSERT INTO activity_logs (user_id, action)
      VALUES (?, ?)
    `, [adminId, `Rejected project #${id}`]);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to reject project:", err.message);
    res.status(500).json({ error: "Failed to reject project" });
  }
});

// Delete (soft delete)
router.delete("/projects/:id", isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const adminId = req.user.user_id;

    await db.query(`
      UPDATE projects 
      SET is_deleted = 1 
      WHERE project_id = ?
    `, [id]);

    await db.query(`
      INSERT INTO activity_logs (user_id, action)
      VALUES (?, ?)
    `, [adminId, `Deleted project #${id}`]);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete project:", err.message);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
