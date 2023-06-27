// All E2E Tests Related to Discovering Cypress goes here.

// Visiting url/website
describe('visit kedro-viz', () => {
  it('Visits the Kedro Viz Home Page', () => {
    cy.visit('/')
  })
});

// Testing commands
describe('testing main command', () => {
  it('checks the response of main api and stores in local storage', () => {
     cy.main() // This test requires backend server to be running
  })
})
