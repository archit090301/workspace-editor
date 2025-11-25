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
import { MemoryRouter, Route, Routes } from "react-router-dom";

jest.mock("../api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import api from "../api";
import { useAuth } from "../AuthContext";
import ProjectEditor from "../pages/ProjectEditor";

// mock localStorage
beforeAll(() => {
  Storage.prototype.getItem = jest.fn(() => null);
  Storage.prototype.setItem = jest.fn(() => {});
  Storage.prototype.removeItem = jest.fn(() => {});
});

// mock auth
jest.mock("../AuthContext", () => ({
  useAuth: jest.fn(),
}));

// mock CodeMirror
jest.mock("@uiw/react-codemirror", () => () => (
  <div data-testid="editor">EDITOR</div>
));

function mount(id = 1) {
  return render(
    <MemoryRouter initialEntries={[`/projects/${id}`]}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectEditor />} />
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProjectEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1, preferred_theme_id: 1 },
      loading: false,
    });
    
    // Mock localStorage for tabs
    Storage.prototype.getItem.mockImplementation((key) => {
      if (key === 'tabs_1') return null;
      return null;
    });
  });

  test("loads initial files", async () => {
    api.get.mockResolvedValueOnce({
      data: [{ file_id: 1, file_name: "test.js", language_id: 1 }],
    });

    mount();

    expect(await screen.findByText("test.js")).toBeInTheDocument();
  });

  test("opens file and shows editor", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ file_id: 1, file_name: "demo.js", language_id: 1 }],
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 1,
          file_name: "demo.js",
          content: "console.log()",
          language_id: 1,
        },
      });

    mount();

    const btn = (await screen.findAllByText("demo.js"))[0];
    fireEvent.click(btn);

    expect(await screen.findByTestId("editor")).toBeInTheDocument();
  });

  test("run button triggers API call", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ file_id: 1, file_name: "run.js", language_id: 1 }],
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 1,
          file_name: "run.js",
          content: "console.log('test')",
          language_id: 1,
        },
      });

    api.post.mockResolvedValue({ data: { stdout: "test output" } });

    mount();

    // Open the file
    const fileBtn = (await screen.findAllByText("run.js"))[0];
    fireEvent.click(fileBtn);

    // Wait for editor to load
    await screen.findByTestId("editor");

    // Click run button
    const runBtn = screen.getByRole("button", { name: "▶ Run" });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/run", expect.objectContaining({
        language: "javascript",
        code: "console.log('test')"
      }));
    });
  });

  test("save triggers PUT request", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ file_id: 9, file_name: "save.js", language_id: 1 }],
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 9,
          file_name: "save.js",
          content: "// some code",
          language_id: 1,
        },
      });

    api.put.mockResolvedValue({});

    mount();

    // Open the file
    const btn = (await screen.findAllByText("save.js"))[0];
    fireEvent.click(btn);

    // Wait for editor to load
    await screen.findByTestId("editor");

    // Click save button
    const saveBtn = screen.getByText("💾 Save");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/files/9",
        expect.objectContaining({
          content: "// some code",
          language_id: 1
        })
      );
    });
  });

  test("create new file works", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    
    api.post.mockResolvedValue({
      data: { file_id: 50, file_name: "hello.js", language_id: 1 },
    });

    mount();

    fireEvent.change(screen.getByPlaceholderText("New file name"), {
      target: { value: "hello.js" },
    });

    fireEvent.click(screen.getByText(/\+ create file/i));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/projects/1/files`,
        expect.objectContaining({
          file_name: "hello.js",
          language_id: 1
        })
      );
    });
  });

  test("delete triggers API", async () => {
    window.confirm = jest.fn(() => true);

    api.get
      .mockResolvedValueOnce({
        data: [{ file_id: 5, file_name: "del.js", language_id: 1 }],
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 5,
          file_name: "del.js",
          content: "// content",
          language_id: 1,
        },
      });

    api.delete.mockResolvedValue({});

    mount();

    // Open the file first
    const btn = (await screen.findAllByText("del.js"))[0];
    fireEvent.click(btn);

    // Wait for editor to load
    await screen.findByTestId("editor");

    // Now click delete button
    const deleteBtn = await screen.findByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("/files/5")
    );
  });

  test("mobile tools menu opens", async () => {
    // Set mobile width
    global.innerWidth = 400;
    
    api.get.mockResolvedValueOnce({ data: [] });

    mount();

    const toolsBtn = await screen.findByRole("button", {
      name: /tools/i,
    });

    fireEvent.click(toolsBtn);

    // Should find the mobile menu header
    await waitFor(() => {
      expect(screen.getByText("Tools")).toBeInTheDocument();
    });
  });

  test("file tabs work correctly", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [
          { file_id: 1, file_name: "file1.js", language_id: 1 },
          { file_id: 2, file_name: "file2.js", language_id: 1 }
        ],
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 1,
          file_name: "file1.js",
          content: "// file1 content",
          language_id: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 2,
          file_name: "file2.js", 
          content: "// file2 content",
          language_id: 1,
        },
      });

    mount();

    // Open first file
    const file1Btn = (await screen.findAllByText("file1.js"))[0];
    fireEvent.click(file1Btn);
    await screen.findByTestId("editor");

    // Open second file
    const file2Btn = (await screen.findAllByText("file2.js"))[0];
    fireEvent.click(file2Btn);

    // Should have both tabs open
    await waitFor(() => {
      expect(screen.getAllByText("file1.js").length).toBeGreaterThan(1);
      expect(screen.getAllByText("file2.js").length).toBeGreaterThan(1);
    });
  });

  test("language selection works", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ file_id: 1, file_name: "lang.js", language_id: 1 }],
      })
      .mockResolvedValueOnce({
        data: {
          file_id: 1,
          file_name: "lang.js",
          content: "// javascript",
          language_id: 1,
        },
      });

    mount();

    // Open file
    const fileBtn = (await screen.findAllByText("lang.js"))[0];
    fireEvent.click(fileBtn);
    await screen.findByTestId("editor");

    // Change language
    const languageSelect = screen.getByDisplayValue("JavaScript");
    fireEvent.change(languageSelect, { target: { value: "python" } });

    expect(languageSelect.value).toBe("python");
  });
});