/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock API
jest.mock("../api", () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

import api from "../api";
import FriendRequests from "../pages/FriendRequest";

describe("FriendRequests Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title", () => {
    api.get.mockResolvedValue({ data: [] });
    render(<FriendRequests />);
    expect(screen.getByText("Friend Requests")).toBeInTheDocument();
  });

  test("shows 'No pending requests' when empty", async () => {
    api.get.mockResolvedValue({ data: [] });

    render(<FriendRequests />);

    await waitFor(() =>
      expect(screen.getByText("No pending requests")).toBeInTheDocument()
    );
  });

  test("loads and displays list of friend requests", async () => {
    api.get.mockResolvedValue({
      data: [
        { request_id: 1, sender_username: "Alice" },
        { request_id: 2, sender_username: "Bob" },
      ],
    });

    render(<FriendRequests />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  test("accept button calls correct API endpoint", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ request_id: 10, sender_username: "Charlie" }],
      })
      .mockResolvedValueOnce({ data: [] });

    api.put.mockResolvedValue({});

    render(<FriendRequests />);

    // First load
    await waitFor(() =>
      expect(screen.getByText("Charlie")).toBeInTheDocument()
    );

    // Click accept
    fireEvent.click(screen.getByText("Accept"));

    // PUT call is correct
    expect(api.put).toHaveBeenCalledWith("/friends/accept/10");

    // Second GET call occurs after refresh
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  test("reject button calls correct API endpoint", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ request_id: 20, sender_username: "Daniel" }],
      })
      .mockResolvedValueOnce({ data: [] });

    api.put.mockResolvedValue({});

    render(<FriendRequests />);

    // First load
    await waitFor(() =>
      expect(screen.getByText("Daniel")).toBeInTheDocument()
    );

    // Click reject
    fireEvent.click(screen.getByText("Reject"));

    // PUT call is correct
    expect(api.put).toHaveBeenCalledWith("/friends/reject/20");

    // Second GET reload after rejecting
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });
});
