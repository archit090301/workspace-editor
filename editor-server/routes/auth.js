const crypto = require("crypto");
const nodemailer = require("nodemailer");
const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const pool = require("../db");
const { ensureAuth } = require("../middleware/auth");

const router = express.Router();

function makeToken() {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex
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

// ------------------- REGISTER -------------------
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3 }).withMessage("Username too short"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Min 6 char password"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;
    try {
      const [dup] = await pool.query(
        "SELECT user_id FROM users WHERE username = ? OR email = ?",
        [username, email]
      );
      if (dup.length > 0)
        return res.status(409).json({ error: "Username or email already in use" });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (username, email, password_hash, role_id, preferred_theme_id)
         VALUES (?, ?, ?, 1, 1)`,
        [username, email, hash]
      );

      req.login(
        { user_id: result.insertId, username, email, role_id: 1, preferred_theme_id: 1 },
        (err) => {
          if (err) return res.status(201).json({ success: true, user_id: result.insertId });
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
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ------------------- LOGIN -------------------
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Login failed" });
      req.logIn(user, (err2) => {
        if (err2) return next(err2);
        return res.json({ success: true, user });
      });
    })(req, res, next);
  }
);

// ------------------- LOGOUT -------------------
router.post("/logout", ensureAuth, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

// ------------------- ME -------------------
router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.user });
  }
  return res.json({ authenticated: false });
});

// ------------------- THEME UPDATE -------------------
router.put("/theme", ensureAuth, async (req, res) => {
  const { theme } = req.body; // "light" or "dark"
  if (!["light", "dark"].includes(theme)) {
    return res.status(400).json({ error: "Invalid theme" });
  }

  try {
    const themeId = theme === "light" ? 1 : 2;
    await pool.query(
      "UPDATE users SET preferred_theme_id = ? WHERE user_id = ?",
      [themeId, req.user.user_id]
    );

    // update user object in session
    req.user.preferred_theme_id = themeId;

    res.json({ success: true, theme });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update theme" });
  }
});

// ------------------- PASSWORD RESET -------------------
router.post("/request-password-reset", [body("email").isEmail().normalizeEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT user_id, email FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (rows.length === 0) {
      return res.json({ ok: true, message: "If the email exists, a reset link has been sent." });
    }

    const user = rows[0];
    const token = makeToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.user_id, token, expiresAt]
    );

    const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const { sent } = await sendResetEmail(user.email, link);

    return res.json({
      ok: true,
      message: sent ? "Reset email sent." : "Dev mode: use the link to reset.",
      resetLink: link,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password/:token", [body("password").isLength({ min: 6 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token } = req.params;
  const { password } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
       WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const { user_id, id: tokenId } = rows[0];
    const hash = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [hash, user_id]);
    await pool.query("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", [tokenId]);

    return res.json({ ok: true, message: "Password reset successful." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
