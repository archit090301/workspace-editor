/* global cy */


describe("Real Login Flow", () => {
  it("logs in on the real deployed server", () => {

    cy.session("archit-session", () => {
      cy.visit("/login", { failOnStatusCode: false });

      cy.intercept("POST", "**/api/login").as("loginRequest");

      cy.get("input#email").type("architcode39@gmail.com");
      cy.get("input#password").type("asdfghjkl");

      cy.contains("Sign In").click();

      cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    });

    cy.visit("/editor", { failOnStatusCode: false });
    cy.url().should("include", "/editor");
    cy.contains("Editor").should("exist");
  });
});
