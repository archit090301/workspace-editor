// routes/admin.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role_id === 2) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Admins only" });
}

// 📊 GET stats
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
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 👥 Get all users (for admin only)
router.get("/users", isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, username, email, role_id FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 🚀 Promote user to admin
router.put("/promote/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await db.query("UPDATE users SET role_id = 2 WHERE user_id = ?", [userId]);
    res.json({ success: true, message: "User promoted to admin ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to promote user" });
  }
});

module.exports = router;
