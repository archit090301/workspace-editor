/**
 * Integration Test – Middleware Authorization
 * ✅ Reject unauthenticated
 * ✅ Allow authorized
 * ✅ Block non-admin
 */

import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { ensureAuth, ensureAdmin } from "../../middleware/auth.js";
import { app as mainApp, server } from "../../server.js";
import db from "../../db.js";

// Create mock Express app for middleware testing
const app = express();
app.use(express.json());
app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Mock authenticated user
const fakeUser = {
  user_id: 1,
  username: "NormalUser",
  role_id: 1, // Not admin
  email: "user@example.com",
};

// Simulate Passport isAuthenticated
function makeAuthed(req, _, next) {
  req.isAuthenticated = () => true;
  req.user = fakeUser;
  next();
}

// Protected routes for testing
app.get("/protected", ensureAuth, (req, res) => res.json({ ok: true }));
app.get("/admin", makeAuthed, ensureAdmin, (req, res) => res.json({ ok: true }));

describe("Middleware Authorization", () => {
  // ------------------------------------------------------------
  // 1️⃣ Reject unauthenticated users
  // ------------------------------------------------------------
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/protected");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  // ------------------------------------------------------------
  // 2️⃣ Allow authenticated (ensureAuth)
  // ------------------------------------------------------------
  it("allows authenticated requests", async () => {
    const authedApp = express();
    authedApp.use(makeAuthed);
    authedApp.get("/protected", ensureAuth, (req, res) => res.json({ ok: true }));

    const res = await request(authedApp).get("/protected");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  // ------------------------------------------------------------
  // 3️⃣ Block non-admin (ensureAdmin)
  // ------------------------------------------------------------
  it("blocks non-admin users", async () => {
    const res = await request(app).get("/admin");
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Forbidden");
  });

  // Cleanup
  afterAll(async () => {
    if (db && typeof db.end === "function") await db.end();
    if (server && typeof server.close === "function")
      await new Promise((resolve) => server.close(resolve));
  });
});
