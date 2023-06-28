// Add any reusable custom commands here

const apiBaseUrl = Cypress.env('apiBaseUrl');

// Network requests
Cypress.Commands.add('main', () => {
  cy.request({
    method: 'GET',
    url: `${apiBaseUrl}/api/main`,
  }).then((response) => {
    expect(response).property('status').to.equal(200);
    expect(response.body).property('pipelines').to.not.be.oneOf([null, '']);
    window.localStorage.setItem('KedroViz', JSON.stringify(response.body));
  });
});

// Intercepting Network requests using fixtures for GraphQL
Cypress.Commands.add('interceptGql', (operationName) => {
  cy.intercept({ method: 'POST', url: `/graphql` }, (req) => {
    req.reply({ fixture: `/graphql/${operationName})}.json` });
  }).as(operationName);
});

// Set a custom function for determining the selector for an element. Falls back to default behavior if returning a falsey value.
Cypress.SelectorPlayground.defaults({
  onElement: ($el) => {
    const customId = $el.attr('data-test');

    if (customId) {
      return `[data-test=${customId}]`;
    }
  },
});

// Custom hover command
Cypress.Commands.add('hover', (selector) => {
  cy.get(selector).trigger('mouseover');
});

// Custom unhover command
Cypress.Commands.add('unhover', (selector) => {
  cy.get(selector).trigger('mouseout');
});
