const { defineConfig } = require('cypress');

module.exports = defineConfig({
  defaultCommandTimeout: 10000,
  env: {
    apiBaseUrl: 'http://localhost:4142',
    coverage: false,
    codeCoverage: {
      url: 'http://localhost:3001/__coverage__',
      exclude: 'cypress/**/*.*',
    },
  },
  e2e: {
    baseUrl: 'http://localhost:4141',
    specPattern: 'cypress/tests/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/index.js',
    experimentalStudio: true,
    watchForFileChanges: true,
  },
  retries: {
    runMode: 2,
  },
  video: false,
  viewportWidth: 1280,
  viewportHeight: 720,
});
