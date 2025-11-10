/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Editor from "../pages/Editor";

jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    user: { username: "Archit", preferred_theme_id: 1 },
    loading: false,
  }),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ projectId: "123", fileId: "456" }),
  useNavigate: () => mockNavigate,
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
jest.mock("../api", () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
}));

jest.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid="codemirror"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const renderEditor = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <Editor />
      </MemoryRouter>
    );
  });
};

describe("Editor Component", () => {
  test("renders header and main sections", async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: "// hello", language_id: 1, file_name: "test.js" },
    });

    await renderEditor();

    expect(await screen.findByText("CodeEditor")).toBeInTheDocument();
    expect(screen.getByText("Project Editor")).toBeInTheDocument();
  });

  test("loads file data on mount and displays it", async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: "console.log('hi');", language_id: 1, file_name: "file1.js" },
    });

    await renderEditor();

    expect(mockGet).toHaveBeenCalledWith("/files/456");
    expect(await screen.findByDisplayValue("console.log('hi');")).toBeInTheDocument();
  });

  test("handles run button click and updates output", async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: "print('hi')", language_id: 2, file_name: "file.py" },
    });
    mockPost.mockResolvedValueOnce({ data: { stdout: "hi\n" } });

    await renderEditor();

    const runBtn = screen.getByText(/Run Code/i);
    await act(async () => fireEvent.click(runBtn));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/run",
        expect.objectContaining({ language: "python" })
      );
      expect(screen.getByText(/✅ Output:/i)).toBeInTheDocument();
    });
  });

  test("handles save button click (existing file)", async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: "code()", language_id: 1, file_name: "main.js" },
    });
    mockPut.mockResolvedValueOnce({ data: { success: true } });

    await renderEditor();

    const saveBtn = screen.getByText(/Save/i);
    await act(async () => fireEvent.click(saveBtn));

    expect(mockPut).toHaveBeenCalledWith(
      "/files/456",
      expect.objectContaining({ content: "code()" })
    );

    await waitFor(() => expect(screen.getByText("💾 Saved")).toBeInTheDocument());
  });

  test("shows AI assistant and sends chat message", async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: "print('AI')", language_id: 2, file_name: "ai.py" },
    });
    mockPost.mockResolvedValueOnce({ data: { assistant: "Sure! Here’s an explanation." } });

    await renderEditor();

    const aiBtn = screen.getByText(/AI Assistant/i);
    await act(async () => fireEvent.click(aiBtn));

    const input = screen.getByPlaceholderText(/Ask the AI/i);
    fireEvent.change(input, { target: { value: "Explain code" } });

    const sendBtn = screen.getByText("Send");
    await act(async () => fireEvent.click(sendBtn));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/ai/chat",
        expect.objectContaining({ messages: expect.any(Array) })
      );
      expect(screen.getByText(/Sure! Here’s an explanation./i)).toBeInTheDocument();
    });
  });

  test("toggles fullscreen mode", async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: "// fullscreen", language_id: 1, file_name: "f.js" },
    });

    await renderEditor();

    const fullscreenBtn = screen.getAllByRole("button", { name: /Fullscreen/i })[0];

    // Toggle ON
    await act(async () => fireEvent.click(fullscreenBtn));
    await waitFor(() =>
      expect(screen.getByText("🗕 Exit Fullscreen")).toBeInTheDocument()
    );

    // Toggle OFF
    const exitBtn = screen.getByText("🗕 Exit Fullscreen");
    await act(async () => fireEvent.click(exitBtn));
    await waitFor(() =>
      expect(screen.getByText("🗖 Fullscreen")).toBeInTheDocument()
    );
  });
});
