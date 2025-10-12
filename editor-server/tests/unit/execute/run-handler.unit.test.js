import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ✅ 1. Mock external modules
const mockPost = jest.fn();
const mockQuery = jest.fn();

jest.unstable_mockModule("axios", () => ({
  default: { post: mockPost },
}));

jest.unstable_mockModule("../../../db.js", () => ({
  default: { query: mockQuery },
}));

// ✅ 2. Import after mocks
const { default: axios } = await import("axios");
const { default: db } = await import("../../../db.js");
const { default: executeRouter } = await import("../../../routes/run.js");

// ✅ 3. Setup express app with auth stub
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = () => true;
  req.user = { user_id: 1, username: "Tester" };
  next();
});
app.use("/api/execute", executeRouter);

describe("Route: /api/execute (Mocked Judge0)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("simulates successful code execution", async () => {
    mockPost.mockResolvedValueOnce({
      data: { stdout: "Hello World\n", stderr: null, compile_output: null, exit_code: 0 },
    });
    mockQuery.mockResolvedValueOnce([[{ insertId: 1 }], []]); // DB insert mock

    const res = await request(app)
      .post("/api/execute")
      .send({ code: 'print("Hello World")', language: "python" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.output).toContain("✅ Output:");
    expect(mockPost).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalled();
  });

  it("handles compile errors correctly", async () => {
    mockPost.mockResolvedValueOnce({
      data: { compile_output: "Syntax error", stderr: null, stdout: null, exit_code: 1 },
    });
    mockQuery.mockResolvedValueOnce([[{ insertId: 1 }], []]);

    const res = await request(app)
      .post("/api/execute")
      .send({ code: "bad code", language: "cpp" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("compile_error");
    expect(res.body.output).toContain("❌ Compilation error:");
  });

  it("handles runtime errors correctly", async () => {
    mockPost.mockResolvedValueOnce({
      data: { stderr: "ZeroDivisionError", stdout: null, compile_output: null, exit_code: 1 },
    });
    mockQuery.mockResolvedValueOnce([[{ insertId: 1 }], []]);

    const res = await request(app)
      .post("/api/execute")
      .send({ code: "1/0", language: "python" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("runtime_error");
    expect(res.body.output).toContain("⚠️ Runtime error:");
  });

  it("returns 400 when code or language missing", async () => {
    const res = await request(app)
      .post("/api/execute")
      .send({ code: "" }); // Missing language

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("handles Judge0 API failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("Judge0 down"));

    const res = await request(app)
      .post("/api/execute")
      .send({ code: "print(1)", language: "python" });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Execution failed");
  });
});
