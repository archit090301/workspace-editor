/**
 * @jest-environment jsdom
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CollabLobby from "../pages/CollabLobby";

// ─────────────────────────────────────────────────────────
// MOCK socket
// ─────────────────────────────────────────────────────────
jest.mock("../socket", () => ({
  socket: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

import { socket as mockSocket } from "../socket";

// ─────────────────────────────────────────────────────────
// MOCK api (used inside AuthContext)
// ─────────────────────────────────────────────────────────
jest.mock("../api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// ─────────────────────────────────────────────────────────
// MOCK AuthContext → so real file (import.meta.env) never loads
// ─────────────────────────────────────────────────────────
jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    user: { username: "Archit", user_id: 1 },
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

// ─────────────────────────────────────────────────────────
// MOCK useNavigate
// ─────────────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.useFakeTimers();
});

// ─────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────
describe("CollabLobby Component - UNIT TESTS", () => {
  test("renders UI correctly", () => {
    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );
    expect(screen.getByText("Start Collaborating")).toBeInTheDocument();
    expect(screen.getByText("Create New Room")).toBeInTheDocument();
  });

  test("loads recent rooms from localStorage", () => {
    localStorage.setItem("recentCollabRooms", JSON.stringify(["ROOM123"]));

    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    expect(screen.getByText("ROOM123")).toBeInTheDocument();
  });

  test("createRoom triggers socket.emit and navigates", async () => {
    mockSocket.emit.mockImplementation((event, data, cb) => {
      if (event === "collab:create_room") cb({ roomId: "ROOM123" });
    });

    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Create New Room/i }));

    await waitFor(() =>
      expect(screen.getByText("🎉 Room created successfully!")).toBeInTheDocument()
    );

    // wait for navigation timeout
    act(() => {
      jest.runAllTimers();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/collab/ROOM123");
  });

  test("joinRoom navigates when room code is entered", async () => {
    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter room code/i), {
      target: { value: "HELLO123" },
    });

    const joinBtn = screen.getByRole("button", { name: /Join/i });
    fireEvent.click(joinBtn);

    act(() => {
      jest.runAllTimers();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/collab/HELLO123");
  });

  test("shows error when joining without entering room code", () => {
    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    const joinBtn = screen.getByRole("button", { name: /Join/i });
    fireEvent.click(joinBtn);

    expect(screen.getByText("⚠️ Please enter a room code")).toBeInTheDocument();
  });

  test("joinRecentRoom navigates correctly", () => {
    localStorage.setItem("recentCollabRooms", JSON.stringify(["ROOM999"]));

    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("ROOM999"));

    act(() => {
      jest.runAllTimers();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/collab/ROOM999");
  });

  test("copyToClipboard works", async () => {
    const mockCopy = jest.fn();
    Object.assign(navigator, {
      clipboard: { writeText: mockCopy },
    });

    localStorage.setItem("recentCollabRooms", JSON.stringify(["ROOMABC"]));

    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    const copyBtn = screen.getByTitle("Copy room code");
    fireEvent.click(copyBtn);

    expect(mockCopy).toHaveBeenCalledWith("ROOMABC");
  });

  test("Create button shows loading state", async () => {
    mockSocket.emit.mockImplementation(() => {});

    render(
      <MemoryRouter>
        <CollabLobby />
      </MemoryRouter>
    );

    const createBtn = screen.getByRole("button", { name: /Create New Room/i });
    fireEvent.click(createBtn);

    expect(createBtn).toBeDisabled();
  });
});
