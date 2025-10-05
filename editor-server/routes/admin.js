import express from "express";
import db from "../db.js";

const router = express.Router();

function isAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.role_id === 2) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Admins only" });
}

router.get("/stats", isAdmin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [projects] = await db.query("SELECT COUNT(*) AS count FROM projects");
    const [files] = await db.query("SELECT COUNT(*) AS count FROM files");

    res.json({
      users: users[0].count,
      projects: projects[0].count,
      files: files[0].count,
    });
  } catch (err) {
    console.error("❌ Failed to fetch stats:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, username, email, role_id FROM users"
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

export default router;
