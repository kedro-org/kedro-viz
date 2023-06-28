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

// Custom command to check if all the classNames exist/not.exist
Cypress.Commands.add('checkClassExistence', (classNames, condition) => {
  classNames.forEach((className) => {
    cy.get(`.${className}`).should(condition);
  });
});

// Custom command to wait for page load before executing
Cypress.Commands.add('waitForPageReload', (callback) => {
  // Wait for pipeline loading icon to be visible
  cy.get('.pipeline-loading-icon--visible').should('exist');

  // Wait for pipeline loading icon to be not visible
  cy.get('.pipeline-loading-icon--visible').should('not.exist').then(callback);
});

// Custom command to check if the attribute of a class satisfies a regex
Cypress.Commands.add('checkAttribute', (className, attribute, regex) => {
  cy.get(`.${className}`).then(($elements) => {
    // Convert Cypress collection to an array
    const elementsArray = $elements.toArray();
  
    // Filter elements that have a title matching the regex pattern
    const filteredElements = elementsArray.filter(($element) => {
      const title = $element.getAttribute(attribute);
      return title && title.match(regex);
    });
    // Check if any filtered elements exist
    expect(filteredElements.length).to.be.greaterThan(0);
  })
})