// Add any reusable custom commands here
import { join } from 'path';

/**
 * Custom command for intercepting network requests using fixtures for GraphQL
 * @param {String} operationName
 * @returns {Object} The mock/fixtured json response
 */
Cypress.Commands.add('__interceptGql__', (operationName) => {
  cy.intercept({ method: 'POST', url: `/graphql` }, (req) => {
    req.reply({ fixture: `/graphql/${operationName})}.json` });
  }).as(operationName);
});

/**
 * Custom command for intercepting network requests for REST
 * @param {String} url
 * @param {String} method
 * @param {String} fixturePath
 * @returns {Object} The mock/fixtured json response
 */
Cypress.Commands.add('__interceptRest__', (url, method, fixturePath) => {
  cy.intercept(method, url, (req) => {
    req.reply((res) => {
      res.send({ fixture: fixturePath });
    });
  });
});

/**
 * Custom command for determining the selector for an element. Falls back to default behavior if returning a falsey value.
 * @returns {String} The selector for an element
 */
Cypress.SelectorPlayground.defaults({
  onElement: ($el) => {
    const customId = $el.attr('data-test');

    if (customId) {
      return `[data-test=${customId}]`;
    }
  },
});

/**
 * Custom command for hovering an element
 * @param {Object} subject
 * @returns {Object} yields the subject passed
 */
Cypress.Commands.add('__hover__', (subject) => {
  cy.get(subject).trigger('mouseover');
});

/**
 * Custom command for unhovering an element
 * @param {Object} subject
 * @returns {Object} yields the subject passed
 */
Cypress.Commands.add('__unhover__', (subject) => {
  cy.get(subject).trigger('mouseout');
});

/**
 * Custom command to wait for page load before executing the callback
 * @param {Object} callback
 */
Cypress.Commands.add('__waitForPageLoad__', (callback) => {
  // Wait for pipeline loading icon to be visible
  cy.get('.pipeline-loading-icon--visible', { timeout: 10000 }).should('exist');

  // Wait for pipeline loading icon to be not visible
  cy.get('.pipeline-loading-icon--visible', { timeout: 10000 })
    .should('not.exist')
    .then(callback);
});

/**
 * Custom command to check for aria label text value of an element
 * @param {Object} subject
 * @param {String} ariaLabelValue
 */
Cypress.Commands.add('__checkForAriaLabel__', (subject, ariaLabelValue) => {
  cy.get(subject).should('have.attr', 'aria-label').and('eq', ariaLabelValue);
});

/**
 * Custom command to compare text values of an element and a comparable text
 * @param {Object} subject
 * @param {String} compareText
 */
Cypress.Commands.add('__checkForText__', (subject, compareText) => {
  cy.get(subject)
    .invoke('text')
    .then((selectedNodeText) => {
      expect(selectedNodeText.toLowerCase()).to.eq(compareText.toLowerCase());
    });
});

/**
 * Custom command to validate the downloaded image
 * @param {String} downloadedFilename
 */
Cypress.Commands.add('__validateImage__', (downloadedFilename) => {
  const downloadsFolder = Cypress.config('downloadsFolder');

  if (!downloadedFilename) {
    downloadedFilename = join(downloadsFolder, 'logo.png');
  }

  // ensure the file has been saved before trying to parse it
  cy.readFile(`${downloadsFolder}/${downloadedFilename}`, 'binary', {
    timeout: 15000,
  }).should((buffer) => {
    expect(buffer.length).to.be.gt(1000);
  });
});
