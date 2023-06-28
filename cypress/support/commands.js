// Add any reusable custom commands here
import spaceflights from '../../src/utils/data/spaceflights.mock.json';

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

// Custom command to filter elements based on className and attribute value satisfying/not-satisfying the regex
Cypress.Commands.add(
  'filterElementsByRegex',
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
Cypress.Commands.add('getApplicationState', () => cy.window().its('__store__'));

// Prepare large dataset
Cypress.Commands.add('prepareLargeDataset', () => {
  const data = { ...spaceflights };
  let extraNodes = [];
  new Array(1000).fill().forEach((d, i) => {
    const extraNodeGroup = data.nodes.map((node) => ({
      ...node,
      id: node.id + i,
      //eslint-disable-next-line camelcase
      modular_pipelines: [],
    }));
    extraNodes = extraNodes.concat(extraNodeGroup);
  });
  data.nodes = data.nodes.concat(extraNodes);
  data.modular_pipelines['__root__'].children.push(
    ...extraNodes.map((node) => ({
      id: node.id,
      type: node.type,
    }))
  );
  return data;
});
