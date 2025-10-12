import request from "supertest";
import { app, server } from "../../server.js";
import db from "../../db.js";

describe("Integration: Files Module", () => {
  const testUser = {
    username: "FileTester",
    email: "filetester@example.com",
    password: "FilePass123!"
  };

  let cookie;
  let projectId;
  let fileId;

  beforeAll(async () => {
    await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);
    await request(app).post("/api/register").send(testUser);

    const login = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    cookie = login.headers["set-cookie"]?.[0];
    expect(cookie).toBeDefined();

    const projectRes = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({
        project_name: "File Integration Project",
        description: "Test project for file routes",
        language: "javascript",
      });

    projectId = projectRes.body.project_id;
    expect(projectId).toBeDefined();
  });

  it("creates a new file in the project", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/files`)
      .set("Cookie", cookie)
      .send({ file_name: "testFile.js", language_id: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("file_id");
    expect(res.body.file_name).toBe("testFile.js");

    fileId = res.body.file_id;
  });

  it("lists files in the project", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/files`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("file_name");
  });

  it("fetches the created file by ID", async () => {
    const res = await request(app)
      .get(`/api/files/${fileId}`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("file_id", fileId);
  });

  it("updates file content successfully", async () => {
    const res = await request(app)
      .put(`/api/files/${fileId}`)
      .set("Cookie", cookie)
      .send({ content: "console.log('Updated content');" });

    expect(res.statusCode).toBe(200);
    expect(res.body.content).toContain("Updated content");
  });

  it("deletes the file successfully", async () => {
    const res = await request(app)
      .delete(`/api/files/${fileId}`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  it("rejects file list request when unauthenticated", async () => {
    const res = await request(app).get(`/api/projects/${projectId}/files`);
    expect([401, 403]).toContain(res.statusCode);
  });

  afterAll(async () => {
    try {
      await db.query(
        "DELETE FROM projects WHERE user_id IN (SELECT user_id FROM users WHERE email = ?)",
        [testUser.email]
      );
      await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    if (db && db.end) await db.end();
    if (server && server.listening)
      await new Promise((resolve) => server.close(resolve));
  });
});
