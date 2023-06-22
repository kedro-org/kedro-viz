const { defineConfig } = require('cypress');

module.exports = defineConfig({
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
    specPattern: 'cypress/tests/**/discovery.cy.{js,jsx}', // [TODO] Need to modify this to include all the test files once finalized
    supportFile: 'cypress/support/index.js',
    experimentalStudio: true,
    watchForFileChanges: true,
  },
  retries: {
    runMode: 2,
  },
  viewportWidth: 1280,
  viewportHeight: 720,
});
