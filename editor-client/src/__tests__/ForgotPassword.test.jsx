/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPassword from "../pages/ForgotPassword";
import api from "../api";

// ─────────────────────────────────────────
// MOCK API
// ─────────────────────────────────────────
jest.mock("../api", () => ({
  post: jest.fn(),
}));

// Simulate development mode (so dev link appears)
beforeAll(() => {
  process.env.NODE_ENV = "development";
});

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the form correctly", () => {
    render(<ForgotPassword />);

    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByText("Send reset link")).toBeInTheDocument();
  });

  test("user can type email", () => {
    render(<ForgotPassword />);

    const input = screen.getByPlaceholderText("Email");

    fireEvent.change(input, { target: { value: "test@example.com" } });

    expect(input.value).toBe("test@example.com");
  });

  test("shows success message when API responds OK", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        message: "Reset link sent!",
        resetLink: "http://example.com/reset/123",
      },
    });

    render(<ForgotPassword />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByText("Send reset link"));

    expect(api.post).toHaveBeenCalledWith("/request-password-reset", {
      email: "test@example.com",
    });

    await waitFor(() => {
      expect(screen.getByText("Reset link sent!")).toBeInTheDocument();
    });

    // Development mode should show dev link
    await waitFor(() => {
      expect(
        screen.getByText("http://example.com/reset/123")
      ).toBeInTheDocument();
    });
  });

  test("shows error message on API failure", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: "Email not found" } },
    });

    render(<ForgotPassword />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "unknown@example.com" },
    });

    fireEvent.click(screen.getByText("Send reset link"));

    await waitFor(() => {
      expect(screen.getByText("Email not found")).toBeInTheDocument();
    });
  });

  test("shows generic error if API has no message", async () => {
    api.post.mockRejectedValueOnce({});

    render(<ForgotPassword />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "anything@example.com" },
    });

    fireEvent.click(screen.getByText("Send reset link"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});
