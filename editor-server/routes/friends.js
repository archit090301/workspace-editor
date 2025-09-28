const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ensureAuth } = require("../middleware/auth");

// 🔍 Search users by username (for adding friends)
router.get("/search", ensureAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });

  try {
    const [rows] = await pool.query(
      "SELECT user_id, username, email FROM users WHERE username LIKE ? AND user_id != ? LIMIT 10",
      [`%${q}%`, req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// ➕ Send friend request
router.post("/add/:friendId", ensureAuth, async (req, res) => {
  const { friendId } = req.params;

  try {
    // prevent duplicate request
    const [exists] = await pool.query(
      "SELECT * FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [req.user.user_id, friendId, friendId, req.user.user_id]
    );
    if (exists.length > 0) return res.status(400).json({ error: "Already friends or pending" });

    await pool.query(
      "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')",
      [req.user.user_id, friendId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add friend" });
  }
});

// 📥 Accept request
router.put("/accept/:friendId", ensureAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE friends SET status='accepted' WHERE user_id=? AND friend_id=? AND status='pending'",
      [req.params.friendId, req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not accept request" });
  }
});

// 📋 List all friends
router.get("/", ensureAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.email, f.status
       FROM friends f
       JOIN users u ON (u.user_id = f.friend_id)
       WHERE f.user_id=? 
       UNION
       SELECT u.user_id, u.username, u.email, f.status
       FROM friends f
       JOIN users u ON (u.user_id = f.user_id)
       WHERE f.friend_id=?`,
      [req.user.user_id, req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch friends" });
  }
});

// ✅ Accept friend request (old style with friend_requests table)
router.put("/friends/accept/:friendId", ensureAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE friend_requests SET status = 'accepted' WHERE sender_id = ? AND receiver_id = ?",
      [req.params.friendId, req.user.user_id]
    );
    // also insert into friends table
    await pool.query(
      "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted'), (?, ?, 'accepted')",
      [req.user.user_id, req.params.friendId, req.params.friendId, req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not accept friend" });
  }
});

// ❌ Reject friend request
router.put("/friends/reject/:friendId", ensureAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE friend_requests SET status = 'rejected' WHERE sender_id = ? AND receiver_id = ?",
      [req.params.friendId, req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reject friend" });
  }
});

// ❌ Remove friend
router.delete("/remove/:friendId", ensureAuth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [req.user.user_id, req.params.friendId, req.params.friendId, req.user.user_id]
    );
    res.json({ success: true, message: "Friend removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove friend" });
  }
});

module.exports = router;
