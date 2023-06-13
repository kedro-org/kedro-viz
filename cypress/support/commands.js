// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

const apiBaseUrl = Cypress.env('apiBaseUrl')

Cypress.Commands.add('main', () => {
    cy.request({
        method: 'GET',
        url: `${apiBaseUrl}/main`
    }).then ((response) => {
            expect(response).property('status').to.equal(200)
            expect(response.body).property('pipelines').to.not.be.oneOf([null, ""])
            window.localStorage.setItem('KedroViz', JSON.stringify(response.body))
    })
})