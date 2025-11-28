import request from "supertest";
import { app, server } from "../../server.js";
import db from "../../db.js";

describe("Integration: Projects Module", () => {
  const testUser = {
    username: "ProjectTester",
    email: "projecttester@example.com",
    password: "ProjPass123!"
  };

  let cookie;
  let projectId;
  let fileId;

  // ---------------------------------------------
  // BEFORE ALL – create user safely
  // ---------------------------------------------
  beforeAll(async () => {
    // Delete test data from previous failed runs
    await db.query(`
      DELETE FROM files 
      WHERE project_id IN (
        SELECT project_id 
        FROM projects 
        WHERE user_id = (SELECT user_id FROM users WHERE email = ?)
      )
    `, [testUser.email]);

    await db.query(`
      DELETE FROM projects 
      WHERE user_id = (SELECT user_id FROM users WHERE email = ?)
    `, [testUser.email]);

    await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);

    // Register fresh user
    await request(app).post("/api/register").send(testUser);

    const login = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    cookie = login.headers["set-cookie"]?.[0];
    expect(cookie).toBeDefined();
  });

  // ---------------------------------------------
  // TEST CASES
  // ---------------------------------------------
  it("denies project listing when unauthenticated", async () => {
    const res = await request(app).get("/api/projects");
    expect([401, 403]).toContain(res.statusCode);
  });

  it("creates a new project successfully", async () => {
    const project = {
      project_name: "Integration Project",
      description: "Testing project endpoints",
      language: "javascript"
    };

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send(project);

    expect(res.statusCode).toBe(201);
    projectId = res.body.project_id;
  });

  it("lists all projects for the logged-in user", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("fetches the created project by ID", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
  });

  it("updates project details successfully", async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Cookie", cookie)
      .send({ project_name: "Updated Project Name" });

    expect(res.statusCode).toBe(200);
    expect(res.body.project_name).toBe("Updated Project Name");
  });

  it("creates a new file inside the project", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/files`)
      .set("Cookie", cookie)
      .send({ file_name: "main.js", language_id: 1 });

    expect(res.statusCode).toBe(201);
    fileId = res.body.file_id;
  });

  it("lists files for the project", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/files`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("deletes the project successfully", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  // ---------------------------------------------
  // AFTER ALL – safe cleanup (FK-safe)
  // ---------------------------------------------
  afterAll(async () => {
    try {
      // Delete FILES first
      await db.query(`
        DELETE FROM files 
        WHERE project_id IN (
          SELECT project_id 
          FROM projects 
          WHERE user_id = (SELECT user_id FROM users WHERE email = ?)
        )
      `, [testUser.email]);

      // Delete PROJECTS second
      await db.query(`
        DELETE FROM projects 
        WHERE user_id = (SELECT user_id FROM users WHERE email = ?)
      `, [testUser.email]);

      // Delete USER last
      await db.query("DELETE FROM users WHERE email = ?", [testUser.email]);

    } catch (e) {
      console.error("Cleanup error:", e);
    }

    if (db && db.end) await db.end();
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
