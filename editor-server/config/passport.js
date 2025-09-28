// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("../db");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const [rows] = await pool.query(
            `SELECT user_id, username, email, password_hash, role_id, preferred_theme_id 
             FROM users WHERE email = ? LIMIT 1`,
            [email]
          );

          if (rows.length === 0) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const user = rows[0];
          const match = await bcrypt.compare(password, user.password_hash);
          if (!match) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // ✅ return full user object (role_id included)
          return done(null, {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role_id: user.role_id,
            preferred_theme_id: user.preferred_theme_id,
          });
        } catch (err) {
          console.error("Passport error:", err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    // ✅ keep only user_id in session
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.query(
        `SELECT user_id, username, email, role_id, preferred_theme_id 
         FROM users WHERE user_id = ? LIMIT 1`,
        [id]
      );

      if (rows.length === 0) return done(null, false);
      return done(null, rows[0]); // ✅ includes role_id
    } catch (err) {
      console.error("Deserialize error:", err);
      return done(err);
    }
  });
};
