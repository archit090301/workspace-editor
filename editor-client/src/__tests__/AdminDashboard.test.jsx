import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import AdminDashboard from "../pages/AdminDashboard";
import api from "../api";

jest.mock("../api", () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

jest.mock("recharts", () => ({
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Legend: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  LineChart: () => null,
  Line: () => null,
}));

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.innerWidth = 1200;
    global.dispatchEvent(new Event("resize"));
  });

  test("renders header and refresh button", async () => {
    api.get
      .mockResolvedValueOnce({ data: { users: 10, projects: 5, files: 3 } })
      .mockResolvedValueOnce({ data: [] });

    await act(async () => render(<AdminDashboard />));

    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();

    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  test("displays stats after successful API fetch", async () => {
    const mockStats = { users: 10, projects: 5, files: 3, executions: 2 };
    api.get
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: [] });

    await act(async () => render(<AdminDashboard />));

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  test("shows error message when stats API fails", async () => {
    api.get
      .mockRejectedValueOnce(new Error("Stats error"))
      .mockResolvedValueOnce({ data: [] });

    await act(async () => render(<AdminDashboard />));

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/i)).toBeInTheDocument();
    });
  });

  test("shows users and allows promote/demote actions", async () => {
    const mockStats = { users: 2, projects: 2, files: 1, executions: 0 };
    const mockUsers = [
      { user_id: 1, username: "Alice", email: "a@test.com", role_id: 1, created_at: new Date() },
      { user_id: 2, username: "Bob", email: "b@test.com", role_id: 2, created_at: new Date() },
    ];

    api.get
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: mockUsers });

    await act(async () => render(<AdminDashboard />));

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    api.put.mockResolvedValueOnce({});
    fireEvent.click(screen.getByText(/Promote/i));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/promote/1"));

    api.put.mockResolvedValueOnce({});
    fireEvent.click(screen.getByText(/Demote/i));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/demote/2"));
  });

  test("handles resize and switches to mobile layout", async () => {
    api.get
      .mockResolvedValueOnce({ data: { users: 1, projects: 1, files: 1, executions: 0 } })
      .mockResolvedValueOnce({ data: [] });

    await act(async () => render(<AdminDashboard />));

    await waitFor(() => expect(api.get).toHaveBeenCalled());

    act(() => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event("resize"));
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /overview/i })).toBeInTheDocument()
    );
  });
});
