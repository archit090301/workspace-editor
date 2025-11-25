/* global cy */

describe("Projects Page E2E", () => {
 beforeEach(() => {
  cy.visit("http://localhost:5173/login");

  cy.get("input[placeholder='Enter your email']")
    .type("architcode39@gmail.com");

  cy.get("input[placeholder='Enter your password']")
    .type("asdfghjkl");

  cy.contains("Sign In").click();

  cy.url().should("include", "/editor");

  // 🔥 FIX: Now go to the projects page
  cy.visit("http://localhost:5173/projects");
});


  it("loads projects list", () => {
    cy.contains("Your Projects").should("exist");
  });

  it("creates a new project", () => {
  cy.get("input[placeholder*='Project name']").type("My Cypress Project");
  cy.contains("Create Project").click();
  cy.contains("My Cypress Project").should("exist");
});


  it("opens a project", () => {
    cy.contains("Open Project").first().click();
    cy.url().should("include", "/projects/");
  });
});
