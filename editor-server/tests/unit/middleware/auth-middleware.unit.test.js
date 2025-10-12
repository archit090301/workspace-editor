import { jest } from "@jest/globals";
import { ensureAuth, ensureRole } from "../../../middleware/auth.js";

describe("Middleware: Auth Functions", () => {

  it("allows request when authenticated", () => {
    const req = { isAuthenticated: () => true };
    const res = {};
    const next = jest.fn();

    ensureAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks request when unauthenticated", () => {
    const req = { isAuthenticated: () => false };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    ensureAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when user role matches", () => {
    const req = {
      isAuthenticated: () => true,
      user: { username: "Admin", role_id: 2 }
    };
    const res = {};
    const next = jest.fn();

    ensureRole(2)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 403 when role does not match", () => {
    const req = {
      isAuthenticated: () => true,
      user: { username: "NormalUser", role_id: 1 }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    ensureRole(2)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });
});
