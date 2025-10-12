import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ✅ Mock db.js for ESM
const mockQuery = jest.fn();
jest.unstable_mockModule("../../../db.js", () => ({
  default: { query: mockQuery },
}));

// ✅ Import after mock
const { default: db } = await import("../../../db.js");
const { default: projectsRouter } = await import("../../../routes/projects.js");

// ✅ Setup Express app with mock auth
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = () => true;
  req.user = { user_id: 1, username: "TestUser" };
  next();
});
app.use("/api/projects", projectsRouter);

// ✅ Test suite
describe("Route: /api/projects (Unit with Mocked DB)", () => {
  afterEach(() => mockQuery.mockReset());

  it("creates a project successfully", async () => {
    // 1️⃣ Insert project (INSERT query)
    mockQuery.mockResolvedValueOnce([[{ insertId: 42 }], []]);
    // 2️⃣ Fetch the project just inserted
    mockQuery.mockResolvedValueOnce([
      [
        {
          project_id: 42,
          project_name: "My Project",
          description: null,
          content: null,
          language: "javascript",
          created_at: "2025-10-11",
          updated_at: "2025-10-11",
        },
      ],
      [],
    ]);

    const res = await request(app)
      .post("/api/projects")
      .send({ project_name: "My Project" });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("project_id", 42);
    expect(res.body).toHaveProperty("project_name", "My Project");
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("handles DB errors gracefully", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB failure"));

    const res = await request(app)
      .post("/api/projects")
      .send({ project_name: "Fail Project" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Could not create project");
  });

  it("validates input (missing name)", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "project_name is required");
  });
});
