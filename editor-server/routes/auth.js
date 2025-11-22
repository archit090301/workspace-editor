import crypto from "crypto";
import nodemailer from "nodemailer";
import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import passport from "passport";
import db from "../db.js";
import { ensureAuth } from "../middleware/auth.js";

const router = express.Router();

function makeToken() {
  return crypto.randomBytes(32).toString("hex"); 
}

async function sendResetEmail(to, link) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("📧 Dev mode (no email creds). Reset link:", link);
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"Editor" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `<p>Click the link to reset your password:</p><p><a href="${link}">${link}</a></p>`,
  });

  return { sent: true };
}


// ============================
// REGISTER
// ============================
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    try {
      const [dup] = await db.query(
        "SELECT user_id FROM users WHERE username = ? OR email = ?",
        [username, email]
      );

      if (dup.length > 0)
        return res.status(409).json({ error: "Username or email already in use" });

      const hash = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        `INSERT INTO users (username, email, password_hash, role_id, preferred_theme_id)
         VALUES (?, ?, ?, 1, 1)`,
        [username, email, hash]
      );

      req.login(
        {
          user_id: result.insertId,
          username,
          email,
          role_id: 1,
          preferred_theme_id: 1,
        },
        (err) => {
          if (err) return res.status(201).json({ success: true });
          return res.status(201).json({
            success: true,
            user: {
              user_id: result.insertId,
              username,
              email,
              role_id: 1,
              preferred_theme_id: 1,
            },
          });
        }
      );
    } catch (err) {
      console.error("❌ Register error:", err.message);
      return res.status(500).json({ error: "Server error" });
    }
  }
);


// ============================
// LOGIN
// ============================
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user)
        return res.status(401).json({ error: info?.message || "Login failed" });

      req.logIn(user, (err2) => {
        if (err2) return next(err2);
        return res.json({ success: true, user });
      });
    })(req, res, next);
  }
);


// ============================
// LOGOUT
// ============================
router.post("/logout", ensureAuth, (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});


// ============================
// WHO AM I
// ============================
router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.user });
  }
  return res.json({ authenticated: false });
});


// ============================
// CHANGE THEME
// ============================
router.put("/theme", ensureAuth, async (req, res) => {
  const { theme } = req.body; 
  if (!["light", "dark"].includes(theme))
    return res.status(400).json({ error: "Invalid theme" });

  try {
    const themeId = theme === "light" ? 1 : 2;

    await db.query(
      "UPDATE users SET preferred_theme_id = ? WHERE user_id = ?",
      [themeId, req.user.user_id]
    );

    req.user.preferred_theme_id = themeId;

    res.json({ success: true, theme });
  } catch (err) {
    console.error("❌ Theme update error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ============================
// REQUEST PASSWORD RESET
// ============================
router.post(
  "/request-password-reset",
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    try {
      const [rows] = await db.query(
        "SELECT user_id, email FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (rows.length === 0) {
        return res.json({
          ok: true,
          message: "If the email exists, a reset link has been sent.",
        });
      }

      const user = rows[0];

      // Delete older tokens
      await db.query(
        "DELETE FROM password_reset_tokens WHERE user_id = ?",
        [user.user_id]
      );

      // Generate fresh token
      const token = makeToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Insert new token
      await db.query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.user_id, token, expiresAt]
      );

      // DEBUG: verify insert
      console.log("RESET INSERT:", user.user_id, token);

      const [debugInsert] = await db.query(
        "SELECT * FROM password_reset_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        [user.user_id]
      );
      console.log("DB AFTER INSERT:", debugInsert);

      const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      const { sent } = await sendResetEmail(user.email, link);

      return res.json({
        ok: true,
        message: sent ? "Reset email sent." : "Dev mode: use the link to reset.",
        resetLink: link,
      });
    } catch (err) {
      console.error("❌ Reset request error:", err.message);
      return res.status(500).json({ error: "Server error" });
    }
  }
);


// ============================
// RESET PASSWORD
// ============================
router.post(
  "/reset-password/:token",
  [body("password").isLength({ min: 6 })],
  async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
      console.log("VERIFY TOKEN:", token);

      // DEBUG: verify raw row
      const [debugRow] = await db.query(
        "SELECT * FROM password_reset_tokens WHERE token = ?",
        [token]
      );
      console.log("DB TOKEN ROW:", debugRow);

      // Actual verification
      const [rows] = await db.query(
        `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
         WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()
         LIMIT 1`,
        [token]
      );

      console.log("ROWS MATCH QUERY:", rows);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const { user_id, id: tokenId } = rows[0];

      const hash = await bcrypt.hash(password, 10);

      await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
        hash,
        user_id,
      ]);

      await db.query(
        "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
        [tokenId]
      );

      return res.json({ ok: true, message: "Password reset successful." });
    } catch (err) {
      console.error("❌ Password reset error:", err.message);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
