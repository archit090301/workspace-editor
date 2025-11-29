/// <reference types="cypress" />
/* global cy */

describe("Delete File Inside Project", () => {

  //
  // LOGIN BEFORE EACH TEST
  //
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

  it("creates and then deletes a file inside a project", () => {

    //
    // STEP 1 — Visit Projects Page
    //
    cy.visit("https://workspace-editor.vercel.app/projects");
    cy.contains("Your Projects", { timeout: 20000 }).should("be.visible");

    //
    // STEP 2 — Create a new project
    //
    cy.get('input[placeholder="Project name *"]').type("Cypress Delete File Project");
    cy.get('input[placeholder="Description (optional)"]').type("Testing file delete");

    cy.contains("Create Project").click();

    cy.contains("Cypress Delete File Project", { timeout: 20000 }).should("exist");

    //
    // STEP 3 — Open the newly created project
    //
    cy.contains("Cypress Delete File Project")
      .closest("div")
      .parent()
      .find("button")
      .contains("Open Project")
      .click();

    cy.url({ timeout: 20000 }).should("include", "/projects/");

    //
    // STEP 4 — Create a file
    //
    cy.get('input[placeholder="New file name"]', { timeout: 15000 })
      .should("be.visible")
      .type("delete_me.js");

    cy.contains("+ Create File").click();

    // Verify file appears
    cy.contains("delete_me.js", { timeout: 15000 }).should("exist");

    //
    // STEP 5 — Open that file (required because delete button is in toolbar)
    //
    cy.contains("delete_me.js").click();

    cy.get(".cm-content", { timeout: 15000 }).should("exist");

    //
    // STEP 6 — Delete the file
    //
    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);  // auto-confirm deletion
    });

    cy.contains("🗑 Delete").click();

    //
    // STEP 7 — Verify the file disappears from sidebar
    //
    cy.contains("delete_me.js").should("not.exist");

  });
});
