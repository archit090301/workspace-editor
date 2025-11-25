/* global cy */

describe("Forgot Password Flow", () => {

  it("loads Forgot Password page", () => {
    cy.visit("/forgot-password");
    cy.contains("Forgot Password").should("be.visible");
  });

  it("submits email", () => {
    cy.visit("/forgot-password");

    cy.get("input[type='email']").type("architcode39@gmail.com");
    cy.contains("Send reset link").click();

    cy.contains(/reset/i).should("be.visible");
  });

});
