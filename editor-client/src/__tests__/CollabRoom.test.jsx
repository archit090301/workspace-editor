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
import CollabRoom from "../pages/CollabRoom";

// Mock the CodeMirror editor (replace with a textarea)
jest.mock("@uiw/react-codemirror", () => {
  return function MockEditor(props) {
    return (
      <textarea
        data-testid="mock-editor"
        value={props.value}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
      >
        {props.value}
      </textarea>
    );
  };
});

// Mock socket
jest.mock("../socket", () => ({
  socket: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));
import { socket as mockSocket } from "../socket";

// Mock API
jest.mock("../api", () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: [{ user_id: 9, username: "FriendA", status: "accepted" }],
    })
  ),
}));

// Mock router + params
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ roomId: "ROOM123" }),
  useNavigate: () => mockNavigate,
}));

// Mock Auth Context
jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    user: { username: "Archit", user_id: 1 },
  }),
}));

// Prevent scrollIntoView error
window.HTMLElement.prototype.scrollIntoView = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

// ───────────────────────────────────────────────
// TEST SUITE
// ───────────────────────────────────────────────

describe("CollabRoom – Minimal Unit Tests", () => {
  test("renders room title + editor", () => {
    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    expect(screen.getByText(/Room:/i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
  });

  test("join_room socket event loads initial state", async () => {
    mockSocket.emit.mockImplementation((event, data, callback) => {
      if (event === "collab:join_room") {
        callback({
          ok: true,
          state: {
            code: "initial code",
            language: "javascript",
            users: ["A", "B"],
          },
        });
      }
    });

    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    // Check if code was updated
    await waitFor(() =>
      expect(screen.getByText("initial code")).toBeInTheDocument()
    );
  });

  test("sending chat message triggers socket.emit", async () => {
    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "hello world" } });

    fireEvent.click(screen.getByText("Send"));

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "collab:message",
      expect.objectContaining({
        roomId: "ROOM123",
        text: "hello world",
      })
    );
  });

  test("runCode triggers socket.emit", () => {
    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Run ▶"));

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "collab:run_code",
      expect.objectContaining({
        roomId: "ROOM123",
        language: "javascript",
      })
    );
  });



  test("leave button triggers navigation", () => {
    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Leave"));

    expect(mockNavigate).toHaveBeenCalledWith("/collab");
  });

  test("language dropdown triggers socket.emit", () => {
    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    const dropdown = screen.getAllByRole("combobox")[1];
    fireEvent.change(dropdown, { target: { value: "python" } });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "collab:language_change",
      expect.objectContaining({
        roomId: "ROOM123",
        language: "python",
      })
    );
  });

  test("code change emits debounced socket event", () => {
    render(
      <MemoryRouter>
        <CollabRoom />
      </MemoryRouter>
    );

    const editor = screen.getByTestId("mock-editor");

    fireEvent.change(editor, { target: { value: "new code" } });

    act(() => {
      jest.runAllTimers();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "collab:code_change",
      expect.objectContaining({
        roomId: "ROOM123",
        code: "new code",
      })
    );
  });
});
