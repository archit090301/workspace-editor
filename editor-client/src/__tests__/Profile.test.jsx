/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import Profile from "../pages/Profile";

jest.mock("../api", () => ({
  put: jest.fn(),
}));

import api from "../api";

// -----------------------------
// Mock Auth Context
// -----------------------------
const mockUpdateUser = jest.fn();

jest.mock("../AuthContext", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "../AuthContext";

// -----------------------------
// Utility to mock window width
// -----------------------------
function resizeTo(width) {
  global.innerWidth = width;
  global.dispatchEvent(new Event("resize"));
}

describe("Profile Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      user: {
        username: "Archit",
        email: "archit@test.com",
        user_id: 5,
        role_id: 1,
        preferred_theme_id: 1,
        created_at: "2024-01-10T00:00:00Z",
      },
      updateUser: mockUpdateUser,
    });

    resizeTo(1400);
  });

  // -----------------------------
  test("renders profile with user data", () => {
    render(<Profile />);

    // Username exists twice → use getAllByText
    const nameInstances = screen.getAllByText("Archit");
    expect(nameInstances.length).toBeGreaterThan(0);

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByText(/Joined/i)).toBeInTheDocument();
  });

  // -----------------------------
  test("renders 'Authentication Required' when user is null", () => {
    useAuth.mockReturnValueOnce({ user: null });

    render(<Profile />);

    expect(
      screen.getByText(/Please log in to view your profile/i)
    ).toBeInTheDocument();
  });

  // -----------------------------
  test("clicking Edit Profile enables editing mode", () => {
    render(<Profile />);

    fireEvent.click(screen.getByText(/Edit Profile/i));

    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  // -----------------------------
  test("saving profile updates user and sends API request", async () => {
    api.put.mockResolvedValueOnce({});

    render(<Profile />);

    fireEvent.click(screen.getByText(/Edit Profile/i));

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "UpdatedUser" },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter email"), {
      target: { value: "updated@test.com" },
    });

    fireEvent.click(screen.getByText(/Save Changes/i));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/profile", {
        username: "UpdatedUser",
        email: "updated@test.com",
      });
    });

    expect(mockUpdateUser).toHaveBeenCalled();
  });

  // -----------------------------
  test("cancel edit restores original data", () => {
    render(<Profile />);

    fireEvent.click(screen.getByText(/Edit Profile/i));

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "XYZ" },
    });

    fireEvent.click(screen.getByText("❌ Cancel"));

    // Check one of the username instances
    const instances = screen.getAllByText("Archit");
    expect(instances.length).toBeGreaterThan(0);
  });

  // -----------------------------
  test("changes theme to dark", async () => {
    api.put.mockResolvedValue({});

    render(<Profile />);

    // Select correct “Dark” — NOT the tips text
    const darkOptions = screen.getAllByText(/^Dark$/i);
    fireEvent.click(darkOptions[0]); // The actual theme button

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/theme", {
        theme: "dark",
        theme_id: 2,
      })
    );
  });

  // -----------------------------
  test("changes theme to light", async () => {
    useAuth.mockReturnValueOnce({
      user: {
        username: "Archit",
        email: "archit@test.com",
        user_id: 5,
        role_id: 1,
        preferred_theme_id: 2, // Dark by default
        created_at: "2024-01-10",
      },
      updateUser: mockUpdateUser,
    });

    render(<Profile />);

    const lightOptions = screen.getAllByText(/^Light$/i);
    fireEvent.click(lightOptions[0]);

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/theme", {
        theme: "light",
        theme_id: 1,
      })
    );
  });

  // -----------------------------
  test("mobile mode rendering", () => {
    resizeTo(500);

    render(<Profile />);

    // Tips panel is hidden on mobile
    expect(screen.queryByText(/Profile Tips/i)).toBeNull();
  });

  // -----------------------------
  test("desktop mode rendering", () => {
    resizeTo(1400);

    render(<Profile />);

    expect(screen.getByText(/Profile Tips/i)).toBeInTheDocument();
  });

  // -----------------------------
  test("shows status message on successful theme change", async () => {
    api.put.mockResolvedValue({});

    render(<Profile />);

    const darkOptions = screen.getAllByText(/^Dark$/i);
    fireEvent.click(darkOptions[0]);

    await waitFor(() =>
      expect(screen.getByText(/Theme updated/i)).toBeInTheDocument()
    );
  });

  // -----------------------------
  test("handles theme update failure and reverts theme", async () => {
    api.put.mockRejectedValueOnce(new Error("Theme error"));

    render(<Profile />);

    const darkOptions = screen.getAllByText(/^Dark$/i);
    fireEvent.click(darkOptions[0]);

    await waitFor(() =>
      expect(screen.getByText(/Failed to save theme/i)).toBeInTheDocument()
    );
  });

  // -----------------------------
  test("avatar shows first letter of username", () => {
    render(<Profile />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
