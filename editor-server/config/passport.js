import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import db from "../db.js";

export default function configurePassport(passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const [rows] = await db.query(
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

          return done(null, {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role_id: user.role_id,
            preferred_theme_id: user.preferred_theme_id,
          });
        } catch (err) {
          console.error("❌ Passport local strategy error:", err.message);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.query(
        `SELECT user_id, username, email, role_id, preferred_theme_id 
         FROM users WHERE user_id = ? LIMIT 1`,
        [id]
      );

      if (rows.length === 0) return done(null, false);
      return done(null, rows[0]);
    } catch (err) {
      console.error("❌ Passport deserialize error:", err.message);
      return done(err);
    }
  });
}
