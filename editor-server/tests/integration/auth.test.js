
import request from "supertest";
import { app, server } from "../../server.js";
import db from "../../db.js";

describe("Integration: Authentication Flow", () => {
  const testUser = {
    username: "ArchitTest",
    email: "archittest@example.com",
    password: "Pass123!"
  };

  let cookie; 

  beforeAll(async () => {
    await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);
  });

  it("registers a new user successfully", async () => {
    const res = await request(app)
      .post("/api/register") 
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("success", true);

    if (res.body.user) {
      expect(res.body.user).toHaveProperty("email", testUser.email);
    } else if (res.body.message) {
      expect(res.body.message).toMatch(/user|registered/i);
    }
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/register")
      .send(testUser);

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/already/i);
  });


  it("logs in successfully with correct credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.user).toHaveProperty("email", testUser.email);

    cookie = res.headers["set-cookie"]?.[0];
    expect(cookie).toBeDefined();
  });

  it("rejects login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: "WrongPassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });


  it("returns authenticated user info when cookie is present", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    if (res.statusCode === 404) {
      const fallback = await request(app)
        .get("/api/me")
        .set("Cookie", cookie);
      expect(fallback.statusCode).toBe(200);
      expect(fallback.body.authenticated).toBe(true);
      expect(fallback.body.user.email).toBe(testUser.email);
    } else {
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("authenticated", true);
      expect(res.body.user).toHaveProperty("email", testUser.email);
    }
  });

  it("returns unauthenticated when no cookie is provided", async () => {
    const res = await request(app).get("/api/auth/me");

    if (res.statusCode === 404) {
      const fallback = await request(app).get("/api/me");
      expect(fallback.statusCode).toBe(200);
      expect(fallback.body).toHaveProperty("authenticated", false);
    } else {
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("authenticated", false);
    }
  });

  it("logs out successfully and clears session", async () => {
    const res = await request(app)
      .post("/api/logout")
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);

    const checkRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    if (checkRes.statusCode === 404) {
      const fallback = await request(app).get("/api/me").set("Cookie", cookie);
      expect(fallback.body.authenticated).toBe(false);
    } else {
      expect(checkRes.body.authenticated).toBe(false);
    }
  });

  afterAll(async () => {
    try {
      await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    if (db && typeof db.end === "function") {
      await db.end();
    }

    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
