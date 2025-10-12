/**
 * Integration Test – Code Execution Module (Final Stable Version)
 * ✅ Run valid code
 * ✅ Fetch execution history
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app, server } from "../../server.js";
import db from "../../db.js";

// ✅ Asynchronous ESM mock for axios
const mockPost = jest.fn();
jest.unstable_mockModule("axios", () => ({
  default: { post: mockPost },
}));

// ✅ Import mocked axios after registering mock
const { default: axios } = await import("axios");

describe("Integration: Code Execution Module", () => {
  const testUser = {
    username: "ExecTester",
    email: "exec@example.com",
    password: "ExecPass123!",
  };

  let cookie;
  let execId;

  // ------------------------------------------------------------
  // Setup – create user + login
  // ------------------------------------------------------------
  beforeAll(async () => {
    await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);
    await request(app).post("/api/register").send(testUser);

    const resLogin = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    cookie = resLogin.headers["set-cookie"]?.[0];
    expect(cookie).toBeDefined();
  });

  // ------------------------------------------------------------
  // ✅ Run Valid Code
  // ------------------------------------------------------------
  it("runs valid JavaScript code successfully", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        stdout: "Hello World\n",
        stderr: null,
        compile_output: null,
        exit_code: 0,
      },
    });

    const res = await request(app)
      .post("/api/run")
      .set("Cookie", cookie)
      .send({
        code: 'console.log("Hello World");',
        language: "javascript",
        stdin: "",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.stdout).toContain("Hello World");

    const [rows] = await db.query(
      "SELECT execution_id FROM executions WHERE user_id = (SELECT user_id FROM users WHERE email = ?) ORDER BY execution_id DESC LIMIT 1",
      [testUser.email]
    );
    execId = rows?.[0]?.execution_id;
    expect(execId).toBeDefined();
  });

  // ------------------------------------------------------------
  // ✅ History
  // ------------------------------------------------------------
  it("lists previous executions in /history", async () => {
    const res = await request(app)
      .get("/api/run/history")
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("execution_id");
  });

  it("fetches a specific execution detail by ID", async () => {
    const res = await request(app)
      .get(`/api/run/history/${execId}`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("execution_id", execId);
  });

  // ------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------
  afterAll(async () => {
    try {
      await db.query(
        "DELETE FROM executions WHERE user_id = (SELECT user_id FROM users WHERE email = ?)",
        [testUser.email]
      );
      await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);
    } catch (err) {
      console.error("Cleanup error:", err.message);
    }

    if (db && typeof db.end === "function") await db.end();
    if (server && typeof server.close === "function")
      await new Promise((resolve) => server.close(resolve));
  });
});
