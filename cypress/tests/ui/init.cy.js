describe('visit kedro-viz', () => {
  it('Visits the Kedro Viz Home Page', () => {
    cy.visit('/')
  })
})

describe('testing main command', () => {
  it('checks the response of main api and stores in local storage', () => {
     cy.main()
  })
})