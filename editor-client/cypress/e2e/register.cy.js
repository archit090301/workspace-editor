/* global cy */

/// <reference types="cypress" />

describe("Register Page", () => {
  beforeEach(() => {
    // IMPORTANT: mock /api/me so app thinks the user is logged-out
    // This prevents automatic redirect to /login at the start
    cy.intercept("GET", "/api/me", {
      statusCode: 200,
      body: { user: null }
    }).as("meCheck");

    cy.visit("/register");
  });

  it("renders all form fields", () => {
    cy.contains("Join CodeEditor").should("exist");

    cy.get('input[placeholder="Choose a username"]').should("exist");
    cy.get('input[placeholder="Enter your email"]').should("exist");
    cy.get('input[placeholder="Create a password"]').should("exist");

    cy.contains("Create Account").should("exist");
  });

  it("allows typing into fields", () => {
    cy.get('input[placeholder="Choose a username"]').type("ArchitUser");
    cy.get('input[placeholder="Enter your email"]').type("archit@test.com");
    cy.get('input[placeholder="Create a password"]').type("StrongPass123!!");

    cy.get('input[placeholder="Choose a username"]').should("have.value", "ArchitUser");
    cy.get('input[placeholder="Enter your email"]').should("have.value", "archit@test.com");
    cy.get('input[placeholder="Create a password"]').should(
      "have.value",
      "StrongPass123!!"
    );
  });

  it("displays error message on failed registration", () => {
    cy.intercept("POST", "/api/register", {
      statusCode: 400,
      body: { error: "Email already exists" },
    }).as("registerFail");

    cy.get('input[placeholder="Choose a username"]').type("Test");
    cy.get('input[placeholder="Enter your email"]').type("test@example.com");
    cy.get('input[placeholder="Create a password"]').type("password123!");

    cy.contains("Create Account").click();

    cy.wait("@registerFail");

    cy.contains("Email already exists").should("be.visible");
  });

//   it("redirects to /editor on successful registration", () => {
//     // mock successful POST /api/register
//     cy.intercept("POST", "/api/register", {
//       statusCode: 200,
//       body: { success: true }
//     }).as("registerSuccess");

//     // IMPORTANT FIX:
//     // After registration, your app calls /api/me again.
//     // If /api/me returns null, your app redirects to /login.
//     // Mock /api/me AS LOGGED-IN USER for the second call.
//     cy.intercept("GET", "/api/me", {
//       statusCode: 200,
//       body: { user: { user_id: 1, username: "Archit" } }
//     }).as("meAfterSuccess");

//     cy.get('input[placeholder="Choose a username"]').type("Archit");
//     cy.get('input[placeholder="Enter your email"]').type("archit@mail.com");
//     cy.get('input[placeholder="Create a password"]').type("MyPass!234");

//     cy.contains("Create Account").click();

//     cy.wait("@registerSuccess");

//     cy.url().should("include", "/editor");
//   });

  it("shows loading state while submitting", () => {
    // slow fake backend
    cy.intercept("POST", "/api/register", (req) => {
      return new Promise((resolve) => {
        setTimeout(
          () => resolve({ statusCode: 200, body: { success: true } }),
          2000
        );
      });
    }).as("slowRegister");

    cy.get('input[placeholder="Choose a username"]').type("LoadTest");
    cy.get('input[placeholder="Enter your email"]').type("load@test.com");
    cy.get('input[placeholder="Create a password"]').type("loadpass123!");

    cy.contains("Create Account").click();

    cy.contains("Creating Account...").should("exist");
    cy.get("button").should("be.disabled");

    cy.wait("@slowRegister");
  });
});
