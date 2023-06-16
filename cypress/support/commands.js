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

const apiBaseUrl = Cypress.env('apiBaseUrl');

// Add any reusable custom commands here
Cypress.Commands.add('main', () => {
  cy.request({
    method: 'GET',
    url: `${apiBaseUrl}/main`,
  }).then((response) => {
    expect(response).property('status').to.equal(200);
    expect(response.body).property('pipelines').to.not.be.oneOf([null, '']);
    window.localStorage.setItem('KedroViz', JSON.stringify(response.body));
  });
});

// Set a custom function for determining the selector for an element. Falls back to default behavior if returning a falsey value.
Cypress.SelectorPlayground.defaults({
  onElement: ($el) => {
    const customId = $el.attr('data-cy');

    if (customId) {
      return `[data-cy=${customId}]`;
    }
  },
});

// Custom hover command
Cypress.Commands.add('hover', selector => {
    cy.get(selector).trigger('mouseover')
});

// Custom unhover command
Cypress.Commands.add('unhover', selector => {
    cy.get(selector).trigger('mouseout')
});
