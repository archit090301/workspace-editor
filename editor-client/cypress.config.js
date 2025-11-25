const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://workspace-editor.vercel.app",
    chromeWebSecurity: false, // IMPORTANT
    experimentalSessionAndOrigin: true, // IMPORTANT
    video: false,
  },
});
