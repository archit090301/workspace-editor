/// <reference types="cypress" />
/* global cy */

describe("Create Project (Deployed UI)", () => {
  beforeEach(() => {
    cy.request({
      method: "POST",
      url: "https://editor-server-o637.onrender.com/api/login",
      body: {
        email: "architcode39@gmail.com",
        password: "asdfghjkl"
      },
      withCredentials: true
    }).then((response) => {
      const cookieHeader = response.headers["set-cookie"]?.[0];
      const token = cookieHeader.split(";")[0].split("=")[1];

      cy.setCookie("connect.sid", token, {
        domain: "workspace-editor.vercel.app",
        secure: true,
        sameSite: "None"
      });
    });
  });

  it("creates a new project", () => {

    // Load projects page
    cy.visit("https://workspace-editor.vercel.app/projects", {
      timeout: 20000
    });

    // Wait for UI to load (Render API is slow)
    cy.contains("Your Projects", { timeout: 20000 }).should("be.visible");

    // Type the project name
    cy.get('input[placeholder="Project name *"]', { timeout: 20000 })
      .type("Cypress Auto Project");

    // Type description
    cy.get('input[placeholder="Description (optional)"]')
      .type("Created via Cypress E2E");

    // Click Create Project button
    cy.contains("Create Project", { timeout: 20000 }).click();

    // Verify project appears
    cy.contains("Cypress Auto Project", { timeout: 20000 }).should("exist");
  });
});
