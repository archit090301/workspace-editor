/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "../pages/Register";

// Prevent dynamic <style> injection (fixes snapshot failure)
jest.spyOn(document.head, "appendChild").mockImplementation(() => {});

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

// Mock AuthContext
jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

// Mock react-router navigation + link
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe("Register Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all fields and UI elements", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByText(/Join CodeEditor/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Choose a username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Create a password/i)).toBeInTheDocument();
  });

  test("submits form successfully and navigates", async () => {
    mockRegister.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Choose a username/i), { target: { value: "Archit" }});
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: "archit@mail.com" }});
    fireEvent.change(screen.getByPlaceholderText(/Create a password/i), { target: { value: "password123" }});

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("Archit", "archit@mail.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith("/editor");
    });
  });

  test("shows error on failed registration", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Registration failed"));

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Choose a username/i), { target: { value: "Archit" }});
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: "wrong@mail.com" }});
    fireEvent.change(screen.getByPlaceholderText(/Create a password/i), { target: { value: "12345" }});

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  test("disables button while loading", async () => {
    mockRegister.mockImplementation(
      () => new Promise(res => setTimeout(() => res(true), 200))
    );

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Choose a username/i), { target: { value: "Test" }});
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: "test@mail.com" }});
    fireEvent.change(screen.getByPlaceholderText(/Create a password/i), { target: { value: "12345678" }});

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("clears error when user types", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Registration failed"));

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    // Trigger error
    fireEvent.change(screen.getByPlaceholderText(/Choose a username/i), { target: { value: "Archit" }});
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: "wrong@mail.com" }});
    fireEvent.change(screen.getByPlaceholderText(/Create a password/i), { target: { value: "12345678" }});

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() =>
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument()
    );

    // NOW TYPE AGAIN → should clear error
    fireEvent.change(screen.getByPlaceholderText(/Choose a username/i), {
      target: { value: "Archit1" },
    });

    expect(screen.queryByText(/Registration failed/i)).not.toBeInTheDocument();
  });
});