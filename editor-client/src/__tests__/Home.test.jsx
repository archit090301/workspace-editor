/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../pages/Home";

describe("Home Page", () => {
  test("renders hero title", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-title")).toBeInTheDocument();
  });

  test("renders subtitle", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-subtitle")).toBeInTheDocument();
  });

  test("renders Get Started button", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const btn = screen.getByTestId("btn-get-started");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("href", "/register");
  });

  test("renders Login button", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const btn = screen.getByTestId("btn-login");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("href", "/login");
  });

  test("renders features section", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByTestId("features-section")).toBeInTheDocument();
  });

  test("renders Join Now button at footer", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const btn = screen.getByTestId("btn-join-now");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("href", "/register");
  });
});
