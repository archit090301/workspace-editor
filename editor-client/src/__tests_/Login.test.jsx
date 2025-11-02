/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

// Mock AuthContext
const mockLogin = jest.fn();
jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// Mock navigation and Link
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login form", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In/i })
    ).toBeInTheDocument();
  });

  test("submits form successfully and navigates", async () => {
    mockLogin.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith("/editor");
    });
  });

  test("shows error on invalid credentials", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid email or password/i)
      ).toBeInTheDocument();
    });
  });

  test("disables button while loading", async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: "loading@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("renders navigation links", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/Forgot password/i).closest("a")).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(screen.getByText(/Create an account/i).closest("a")).toHaveAttribute(
      "href",
      "/register"
    );
  });
});
