// This file gets loaded automatically before all the test files.

import './commands';

// Command to perform before each test case run
beforeEach(() => {
  // For reference: We can intercept requests and use fixtures in case we do not start backend server
  // Intercept all Graphql operations in beforeEach or respective tests
  // cy.interceptGql("getVersion")
  // cy.interceptGql("getRunsList")
  // cy.intercept('/api/main', { fixture: 'rest/main' }).as('main')
  // cy.wait(['@main'])
  cy.visit('/');
});
