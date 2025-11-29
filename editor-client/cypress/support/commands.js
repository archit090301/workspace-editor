/* global Cypress */
/* global cy */


Cypress.Commands.add("login", () => {
  cy.request("POST", "https://editor-server-o637.onrender.com/api/login", {
    email: "architcode39@gmail.com",
    password: "asdfghjkl"
  }).then((response) => {
    const cookie = response.headers["set-cookie"]?.[0];
    if (cookie) {
      const tokenValue = cookie.split(";")[0].split("=")[1];
      cy.setCookie("token", tokenValue, {
        domain: "workspace-editor.vercel.app",
        secure: true,
        sameSite: "None"
      });
    }
  });
});
