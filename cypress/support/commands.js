// Add any reusable custom commands here

// Intercepting Network requests using fixtures for GraphQL
Cypress.Commands.add('__interceptGql__', (operationName) => {
  cy.intercept({ method: 'POST', url: `/graphql` }, (req) => {
    req.reply({ fixture: `/graphql/${operationName})}.json` });
  }).as(operationName);
});

// Intercepting Network request for REST api
Cypress.Commands.add('__interceptRest__', (url, method, fixturePath) => {
  cy.intercept(method, url, (req) => {
    req.reply((res) => {
      res.send({ fixture: fixturePath });
    });
  });
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
Cypress.Commands.add('__hover__', (selector) => {
  cy.get(selector).trigger('mouseover');
});

// Custom unhover command
Cypress.Commands.add('__unhover__', (selector) => {
  cy.get(selector).trigger('mouseout');
});

// Custom command to check if all the classNames exist/not.exist
Cypress.Commands.add('__checkClassExistence__', (classNames, condition) => {
  classNames.forEach((className) => {
    cy.get(`.${className}`).should(condition);
  });
});

// Custom command to wait for page load before executing
Cypress.Commands.add('__waitForPageLoad__', (callback) => {
  // Wait for pipeline loading icon to be visible
  cy.get('.pipeline-loading-icon--visible').should('exist');

  // Wait for pipeline loading icon to be not visible
  cy.get('.pipeline-loading-icon--visible').should('not.exist').then(callback);
});

// Custom command to filter elements based on className and attribute value satisfying/not-satisfying the regex
Cypress.Commands.add(
  '__filterElementsByRegex__',
  (className, attribute = 'title', regex, isMatch = true) => {
    cy.get(`.${className}`).then(($elements) => {
      // Convert Cypress collection to an array
      const elementsArray = $elements.toArray();

      // Filter elements that have a title matching the regex pattern
      const filteredElements = elementsArray.filter(($element) => {
        const attrValue = $element.getAttribute(attribute);
        return (
          attrValue &&
          (isMatch ? attrValue.match(regex) : !attrValue.match(regex))
        );
      });

      return filteredElements;
    });
  }
);

// Get application state
Cypress.Commands.add('__getApplicationState__', () =>
  cy.window().its('__store__')
);

// Check for aria-label
Cypress.Commands.add('__checkForAriaLabel__', (subject, ariaLabelValue) => {
  cy.get(subject).should('have.attr', 'aria-label').and('eq', ariaLabelValue);
});
