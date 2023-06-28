// All E2E Tests Related to Discovering Cypress goes here.

// Visiting url/website
describe('visit kedro-viz', () => {
  it('Visits the Kedro Viz Home Page', () => {
    cy.visit('/');
  });
});

// Testing commands
describe('testing main command', () => {
  it('checks the response of main api and stores in local storage', () => {
    cy.main(); // This test requires backend server to be running
  });
});

// Hover/UnHover Tests

// Hover View your pipeline
cy.hover('[data-test="View your pipeline"]');
cy.get('[data-test="View your pipeline"]').within(() => {
  return cy
    .get('span')
    .should('have.class', 'pipeline-toolbar__label__visible');
});
// UnHover View your pipeline
cy.unhover('[data-test="View your pipeline"]');
cy.get('[data-test="View your pipeline"]').within(() => {
  return cy
    .get('span')
    .should('not.have.class', 'pipeline-toolbar__label__visible');
});

// Hover View your experiments
cy.hover('[data-test="View your experiments"]');
cy.get('[data-test="View your experiments"]').within(() => {
  return cy
    .get('span')
    .should('have.class', 'pipeline-toolbar__label__visible');
});
// UnHover View your experiments
cy.unhover('[data-test="View your experiments"]');
cy.get('[data-test="View your experiments"]').within(() => {
  return cy
    .get('span')
    .should('not.have.class', 'pipeline-toolbar__label__visible');
});

// Hover Toggle Theme
cy.hover('[data-test="Toggle Theme"]');
cy.get('[data-test="Toggle Theme"]').within(() => {
  return cy
    .get('span')
    .should('have.class', 'pipeline-toolbar__label__visible');
});
// UnHover Toggle Theme
cy.unhover('[data-test="Toggle Theme"]');
cy.get('[data-test="Toggle Theme"]').within(() => {
  return cy
    .get('span')
    .should('not.have.class', 'pipeline-toolbar__label__visible');
});

// Hover Change the settings flags
cy.hover('[data-test="Change the settings flags"]');
cy.get('[data-test="Change the settings flags"]').within(() => {
  return cy
    .get('span')
    .should('have.class', 'pipeline-toolbar__label__visible');
});
// UnHover Change the settings flags
cy.unhover('[data-test="Change the settings flags"]');
cy.get('[data-test="Change the settings flags"]').within(() => {
  return cy
    .get('span')
    .should('not.have.class', 'pipeline-toolbar__label__visible');
});
