/// <reference types="cypress" />
/* global cy */

describe("Delete Project (Deployed UI)", () => {

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


  it("deletes a project", () => {

    cy.visit("https://workspace-editor.vercel.app/projects", {
      timeout: 20000,
    });

    cy.contains("Your Projects", { timeout: 20000 }).should("be.visible");

    // 1. Create a temp project to delete
    cy.get('input[placeholder="Project name *"]').type("Cypress Temp Delete");
    cy.get('input[placeholder="Description (optional)"]').type("Delete test");

    cy.contains("Create Project").click();

    // 2. Confirm project exists
    cy.contains("Cypress Temp Delete", { timeout: 15000 }).should("exist");

    // Handle confirm pop-up
    cy.on("window:confirm", () => true);

    // 3. Target the project card for deletion
    cy.contains("Cypress Temp Delete")  // find title H4
      .parents()                        // go up DOM
      .eq(2)                            // reach the projectCard container
      .find("button")                   // get all buttons inside
      .contains("Delete")               // filter to delete btn
      .click();

    // 4. Verify removed
    cy.contains("Cypress Temp Delete").should("not.exist");
  });

});
