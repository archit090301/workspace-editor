import express from "express";
import db from "../db.js";
import { ensureAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/search", ensureAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });

  try {
    const [rows] = await db.query(
      "SELECT user_id, username, email FROM users WHERE username LIKE ? AND user_id != ? LIMIT 10",
      [`%${q}%`, req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

router.post("/add/:friendId", ensureAuth, async (req, res) => {
  const { friendId } = req.params;

  try {
    const [exists] = await db.query(
      "SELECT * FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [req.user.user_id, friendId, friendId, req.user.user_id]
    );

    if (exists.length > 0)
      return res.status(400).json({ error: "Already friends or pending" });

    await db.query(
      "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')",
      [req.user.user_id, friendId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Add friend error:", err.message);
    res.status(500).json({ error: "Could not add friend" });
  }
});

router.put("/accept/:friendId", ensureAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE friends SET status='accepted' WHERE user_id=? AND friend_id=? AND status='pending'",
      [req.params.friendId, req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Accept request error:", err.message);
    res.status(500).json({ error: "Could not accept request" });
  }
});

router.get("/", ensureAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
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
    console.error("❌ Fetch friends error:", err.message);
    res.status(500).json({ error: "Could not fetch friends" });
  }
});

router.put("/friends/accept/:friendId", ensureAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE friend_requests SET status = 'accepted' WHERE sender_id = ? AND receiver_id = ?",
      [req.params.friendId, req.user.user_id]
    );

    await db.query(
      "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted'), (?, ?, 'accepted')",
      [req.user.user_id, req.params.friendId, req.params.friendId, req.user.user_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Accept (old style) error:", err.message);
    res.status(500).json({ error: "Could not accept friend" });
  }
});

router.put("/friends/reject/:friendId", ensureAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE friend_requests SET status = 'rejected' WHERE sender_id = ? AND receiver_id = ?",
      [req.params.friendId, req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Reject friend error:", err.message);
    res.status(500).json({ error: "Could not reject friend" });
  }
});

router.delete("/remove/:friendId", ensureAuth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [req.user.user_id, req.params.friendId, req.params.friendId, req.user.user_id]
    );
    res.json({ success: true, message: "Friend removed" });
  } catch (err) {
    console.error("❌ Remove friend error:", err.message);
    res.status(500).json({ error: "Could not remove friend" });
  }
});

export default router;
