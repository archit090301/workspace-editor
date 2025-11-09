/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Projects from "../pages/Projects";
import { fetchProjects, createProject, deleteProject } from "../apiProjects";
import { MemoryRouter } from "react-router-dom";

jest.mock("../apiProjects", () => ({
  fetchProjects: jest.fn(),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Projects Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state and then projects", async () => {
    fetchProjects.mockResolvedValueOnce({
      data: [
        {
          project_id: 1,
          project_name: "My Project",
          description: "Test project",
          created_at: "2025-10-01T00:00:00Z",
        },
      ],
    });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    // Initially shows loading
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("My Project")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/your projects/i)[0]).toBeInTheDocument();

    expect(fetchProjects).toHaveBeenCalledTimes(1);
  });

  test("displays empty state when no projects", async () => {
    fetchProjects.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    );
  });

  test("shows error if project loading fails", async () => {
    fetchProjects.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    );
  });

  test("creates a new project successfully", async () => {
    fetchProjects.mockResolvedValueOnce({ data: [] });
    createProject.mockResolvedValueOnce({
      data: {
        project_id: 99,
        project_name: "New Project",
        description: null,
        created_at: "2025-10-01T00:00:00Z",
      },
    });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    );

    const nameInput = screen.getByPlaceholderText(/project name/i);
    const createBtn = screen.getByRole("button", { name: /create project/i });

    fireEvent.change(nameInput, { target: { value: "New Project" } });
    fireEvent.click(createBtn);

    await waitFor(() =>
      expect(screen.getByText("New Project")).toBeInTheDocument()
    );

    expect(createProject).toHaveBeenCalledWith({
      project_name: "New Project",
      description: null,
    });
  });

  test("shows validation error when name too short", async () => {
    fetchProjects.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    );

    const nameInput = screen.getByPlaceholderText(/project name/i);
    const createBtn = screen.getByRole("button", { name: /create project/i });

    fireEvent.change(nameInput, { target: { value: "a" } });
    fireEvent.click(createBtn);

    expect(
      screen.getByText(/project name must be at least 3 characters/i)
    ).toBeInTheDocument();
  });

  test("deletes a project successfully", async () => {
    window.confirm = jest.fn(() => true);

    fetchProjects.mockResolvedValueOnce({
      data: [
        {
          project_id: 1,
          project_name: "Delete Me",
          description: "Test",
          created_at: "2025-10-01T00:00:00Z",
        },
      ],
    });

    deleteProject.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Delete Me")).toBeInTheDocument()
    );

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith(1));

    // The deleted project should no longer be visible
    await waitFor(() =>
      expect(screen.queryByText("Delete Me")).not.toBeInTheDocument()
    );
  });

  test("navigates when clicking open project", async () => {
    fetchProjects.mockResolvedValueOnce({
      data: [
        {
          project_id: 7,
          project_name: "Navigate Project",
          description: "",
          created_at: "2025-10-01T00:00:00Z",
        },
      ],
    });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Navigate Project")).toBeInTheDocument()
    );

    const openBtn = screen.getByRole("button", { name: /open project/i });
    fireEvent.click(openBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/projects/7");
  });
});
