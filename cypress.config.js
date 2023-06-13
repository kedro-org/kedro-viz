const { defineConfig } = require("cypress");

module.exports = defineConfig({
  retries: {
    runMode: 2,
  },
  env: {
    apiUrl: "http://localhost:4142",
    coverage: false,
    codeCoverage: {
      url: "http://localhost:3001/__coverage__",
      exclude: "cypress/**/*.*"
    },
  },
  e2e: {
    baseUrl: "http://localhost:4141",
    specPattern: "cypress/integration/**/*.spec.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/index.js"
  },
  video: false
});
