/// <reference types="cypress" />
/* global cy */

describe("Create File Inside Project", () => {

  beforeEach(() => {
    cy.request({
      method: "POST",
      url: "https://editor-server-o637.onrender.com/api/login",
      body: {
        email: "architcode39@gmail.com",
        password: "asdfghjkl"
      },
      withCredentials: true
    }).then((res) => {
      const cookie = res.headers["set-cookie"][0].split(";")[0].split("=")[1];
      cy.setCookie("connect.sid", cookie, {
        domain: "workspace-editor.vercel.app",
        secure: true,
        sameSite: "None"
      });
    });
  });

  it("creates a file inside a new project", () => {

    // STEP 1 — Create a new project
    cy.visit("https://workspace-editor.vercel.app/projects");

    cy.contains("Your Projects", { timeout: 20000 }).should("be.visible");

    cy.get('input[placeholder="Project name *"]').type("Cypress File Project");
    cy.get('input[placeholder="Description (optional)"]').type("Testing file creation");

    cy.contains("Create Project").click();

    cy.contains("Cypress File Project", { timeout: 20000 }).should("exist");

    // STEP 2 — Open the project
    cy.contains("Cypress File Project")
      .closest("div")
      .parent()
      .find("button")
      .contains("Open Project")
      .click();

    // STEP 3 — Verify project editor loaded
    cy.url({ timeout: 20000 }).should("include", "/projects/");

    // STEP 4 — Create a file (THIS MATCHES YOUR UI)
    cy.get('input[placeholder="New file name"]', { timeout: 20000 })
      .should("be.visible")
      .type("test_file.js");

    cy.contains("+ Create File").click();

    // STEP 5 — Verify file appears in sidebar
    cy.contains("test_file.js", { timeout: 15000 }).should("exist");

    // STEP 6 — Click the file (loads via GET /files/:id)
    cy.contains("test_file.js").click();

    // CodeMirror loads
    cy.get(".cm-content", { timeout: 15000 }).should("exist");

  });

});
