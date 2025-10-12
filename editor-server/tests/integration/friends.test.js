import { jest } from "@jest/globals";
import request from "supertest";
import { app, server } from "../../server.js";
import db from "../../db.js";

describe("Integration: Friends Module", () => {
  const userA = {
    username: "SenderUser",
    email: "sender@example.com",
    password: "Pass123!",
  };
  const userB = {
    username: "ReceiverUser",
    email: "receiver@example.com",
    password: "Pass123!",
  };

  let cookieA, cookieB, friendIdB;

  beforeAll(async () => {
    jest.spyOn(console, "error").mockImplementation((msg, ...args) => {
      if (
        typeof msg === "string" &&
        msg.includes("Truncated incorrect DOUBLE value")
      ) {
        return;
      }
      console._errorOriginal
        ? console._errorOriginal(msg, ...args)
        : console.error(msg, ...args);
    });

    await db.query("DELETE FROM users WHERE email IN (?, ?)", [
      userA.email,
      userB.email,
    ]);

    await request(app).post("/api/register").send(userA);
    await request(app).post("/api/register").send(userB);

    const loginA = await request(app)
      .post("/api/login")
      .send({ email: userA.email, password: userA.password });
    cookieA = loginA.headers["set-cookie"]?.[0];

    const loginB = await request(app)
      .post("/api/login")
      .send({ email: userB.email, password: userB.password });
    cookieB = loginB.headers["set-cookie"]?.[0];

    const [rows] = await db.query("SELECT user_id FROM users WHERE email=?", [
      userB.email,
    ]);
    friendIdB = rows[0].user_id;
  });

  it("sends a friend request successfully", async () => {
    const res = await request(app)
      .post(`/api/friends/add/${friendIdB}`)
      .set("Cookie", cookieA);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  it("prevents sending duplicate friend requests", async () => {
    const res = await request(app)
      .post(`/api/friends/add/${friendIdB}`)
      .set("Cookie", cookieA);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/already/i);
  });

  it("accepts a pending friend request", async () => {
    const [rows] = await db.query("SELECT user_id FROM users WHERE email=?", [
      userA.email,
    ]);
    const userAId = rows[0].user_id;

    const res = await request(app)
      .put(`/api/friends/accept/${userAId}`)
      .set("Cookie", cookieB);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  it("lists friends for both users after acceptance", async () => {
    const resA = await request(app)
      .get("/api/friends")
      .set("Cookie", cookieA);
    const resB = await request(app)
      .get("/api/friends")
      .set("Cookie", cookieB);

    expect(resA.statusCode).toBe(200);
    expect(Array.isArray(resA.body)).toBe(true);
    expect(resA.body[0]).toHaveProperty("status");

    expect(resB.statusCode).toBe(200);
    expect(resB.body.some((f) => f.email === userA.email)).toBe(true);
  });

  afterAll(async () => {
    try {
      await db.query(
        "DELETE FROM friends WHERE user_id IN (SELECT user_id FROM users WHERE email IN (?, ?))",
        [userA.email, userB.email]
      );
      await db.query("DELETE FROM users WHERE email IN (?, ?)", [
        userA.email,
        userB.email,
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    if (db && db.end) await db.end();
    if (server && server.listening)
      await new Promise((resolve) => server.close(resolve));
  });
});
