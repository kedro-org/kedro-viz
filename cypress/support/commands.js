// Add any reusable custom commands here
import { join } from 'path';

/**
 * Custom command for intercepting network requests using fixtures for GraphQL
 * @param {String} operationName
 * @returns {Object} The mock/fixtured json response
 */
Cypress.Commands.add('__interceptGql__', (operationName, mutationFor) => {
  // Assign an alias to the intercept based on the graphql request (mutation or query).
  const interceptAlias = mutationFor ? mutationFor : operationName;

  cy.intercept('POST', '/graphql', (req) => {
    const requestBody = req.body;

    // check for the operation name match in the graphql request body
    if (requestBody?.operationName === operationName) {
      // Assign a fixture path based on the graphql request (mutation or query).
      const fixturePath = mutationFor
        ? `graphql/${mutationFor}.json`
        : `graphql/${operationName}.json`;

      // Stub the server response (request will never reach the origin server, instead the response is
      // served from the fixture)
      req.reply({ fixture: fixturePath });
    }
  }).as(interceptAlias);
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
    req.reply({ fixture: fixturePath });
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
  cy.get('.pipeline-loading-icon--visible', { timeout: 5000 }).should('exist');

  // Wait for pipeline loading icon to be not visible
  cy.get('.pipeline-loading-icon--visible', { timeout: 8000 })
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
    timeout: 5000,
  }).should((buffer) => {
    expect(buffer.length).to.be.gt(1000);
  });
});

/**
 * Custom command to validate the downloaded csv
 * @param {String} downloadedFilename
 * @param {Array} recordToCompare
 */
Cypress.Commands.add(
  '__validateCsv__',
  (downloadedFilename, recordToCompare) => {
    const downloadsFolder = Cypress.config('downloadsFolder');

    if (!downloadedFilename) {
      downloadedFilename = join(downloadsFolder, 'data.csv');
    }

    cy.readFile(`${downloadsFolder}/${downloadedFilename}`, {
      timeout: 5000,
    }).then((csvContent) => {
      const modifiedCsvContent = csvContent.replace(/\\|"/g, '');

      expect(modifiedCsvContent).to.have.length.gt(50);

      const records = modifiedCsvContent.split('\n');

      cy.wrap(records[0].trim()).should('eq', recordToCompare.join(',').trim());
    });
  }
);

/**
 * Custom command to conditionally visit a page based on spec file path
 */
Cypress.Commands.add('__conditionalVisit__', () => {
  const specPath = Cypress.spec.relative;

  if (specPath.includes('experiment-tracking')) {
    // Queries
    cy.__interceptGql__('getRunsList');
    cy.__interceptGql__('getRunData');
    cy.__interceptGql__('getMetricPlotData');

    cy.visit('/experiment-tracking');

    cy.wait(['@getRunsList', '@getRunData', '@getMetricPlotData']);
  } else {
    cy.visit('/');
  }
});

/**
 * Custom command to go into comparison mode and select three runs
 */
Cypress.Commands.add('__comparisonMode__', () => {
  // Alias
  cy.get('.switch__input').as('compareRunsToggle');

  // Action
  cy.get('@compareRunsToggle').check({ force: true });

  // Mutation for two run comparison
  cy.__interceptGql__('getRunData', 'compareTwoRuns');

  // Action and wait
  cy.get(':nth-child(2) > .runs-list-card__checked').click();
  cy.wait('@compareTwoRuns').its('response.statusCode').should('eq', 200);

  // Mutations for three run comparison
  cy.__interceptGql__('getRunData', 'compareThreeRuns');

  // Action and wait
  cy.get(':nth-child(3) > .runs-list-card__checked').click();
  cy.wait('@compareThreeRuns').its('response.statusCode').should('eq', 200);
});

/**
 * Custom command to fillout and submit the hosting shareable URL form
 */
Cypress.Commands.add(
  '__setupAndSubmitShareableUrlForm__',
  (bucketName, endpointName, primaryButtonNodeText) => {
    // Intercept the network request to mock with a fixture
    cy.__interceptRest__(
      '/api/deploy',
      'POST',
      '/mock/deploySuccessResponse.json'
    ).as('publishRequest');

    // Reload the page to ensure a fresh state
    cy.reload();

    // Open the deploy modal
    cy.get('.pipeline-menu-button--deploy').click();

    // Select the first hosting platform from the dropdown
    cy.get('.shareable-url-modal [data-test=shareable-url-modal-dropdown-hosting-platform]').click();
    cy.get('.shareable-url-modal .dropdown__options section div').eq(1).click();

    // Fill in the form
    cy.get('.shareable-url-modal [data-test="shareable-url-modal-input-bucket-name"]').type(bucketName);
    cy.get('.shareable-url-modal [data-test="shareable-url-modal-input-endpoint"]').type(
      endpointName
    );

    // Submit the form
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();
  }
);

/**
 * Custom command to wait for page load before enabling pretty names
 */
Cypress.Commands.add('__waitForSettingsButton__', () => {
  cy.get('[data-test="global-toolbar-settings-btn"]', { timeout: 20000 }).should('be.visible');
});

/**
 * Custom command to enable pretty name
 */
Cypress.Commands.add('enablePrettyNames', () => {

  // Wait for the settings button to be visible
  cy.__waitForSettingsButton__();

  // Visit the settings panel
  cy.get('[data-test="global-toolbar-settings-btn"]').click();

  // Enable the pretty names setting
  cy.get('[data-test*="settings-modal-toggle-isPrettyName-"]').check({ force: true });

  // Apply changes and close the settings panel
  cy.get('[data-test="settings-modal-apply-btn"]').click({
        force: true,
      });
});
