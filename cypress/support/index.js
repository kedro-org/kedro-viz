// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Command to perform before each test case run
beforeEach(() => {
    cy.intercept('/api/main', { fixture: 'rest/main' }).as('main')

    // Intercept all Graphql operations in beforeEach or respective tests
    // cy.interceptGql("getVersion")
    // cy.interceptGql("getRunsList")

    cy.visit('/')
    cy.wait(['@main'])
})
