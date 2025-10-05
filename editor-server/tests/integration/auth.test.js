import request from "supertest";
import { app, server } from "../../server.js";
import db from "../../db.js";

describe("Integration: Duplicate Registration", () => {
  const testEmail = "archittest@example.com"; 
  const testUser = {
    username: "ArchitTest",
    email: testEmail,
    password: "Pass123!"
  };

  beforeAll(async () => {
    await db.query("DELETE FROM users WHERE email = ?", [testEmail]);
  });

  it("registers user first time successfully", async () => {
    const res = await request(app).post("/api/register").send(testUser);
    expect(res.statusCode).toBe(201);
  });

  it("fails on duplicate registration (second time)", async () => {
    const res = await request(app).post("/api/register").send(testUser);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already in use/i);
  });

  afterAll(async () => {
    await db.query("DELETE FROM users WHERE email = ?", [testEmail]);

    if (db && typeof db.end === "function") {
      await db.end();
    }

    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
