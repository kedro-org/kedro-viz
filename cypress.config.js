const { defineConfig } = require("cypress");

module.exports = defineConfig({
  env: {
    apiBaseUrl: "http://localhost:4142/api",
    coverage: false,
    codeCoverage: {
      url: "http://localhost:3001/__coverage__",
      exclude: "cypress/**/*.*"
    },
  },
  e2e: {
    baseUrl: "http://localhost:4141",
    specPattern: "cypress/tests/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/index.js"
  },
  retries: {
    runMode: 2,
  },
  viewportWidth: 1280,
  viewportHeight: 720,
});
