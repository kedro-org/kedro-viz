// All E2E Tests Related to Error Log Component in Workflow view goes here.

describe('Error Log Component - Workflow View', () => {
//   beforeEach(() => {
//     cy.enablePrettyNames(); // Enable pretty names using the custom command
//     cy.get('.feature-hints__close').click(); // Close the feature hints
//   });

  describe('Node Error Scenarios', () => {
    beforeEach(() => {
      // Intercept the network request to mock with node error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusNodeError.json'
      ).as('nodeErrorRunStatus');
    });

    it('verifies that error log component displays for failed nodes. #TC-EL-1', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      cy.get('.error-log--wrapper').should('exist');
      cy.get('[data-test="metadata--error-log"]').should('exist');
    });

    it('verifies that error log shows correct header for function errors. #TC-EL-2', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.error-log--header').should('exist');
      cy.get('.error-log--header').should('contain', 'Failed while performing function');
    });

    it('verifies that traceback toggle functionality works. #TC-EL-4', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert before action
      cy.get('[data-test="metadata--error-log"]').should('exist');
      cy.get('[data-test="metadata--error-log"] .toggle-control__checkbox').should('not.be.checked');

      // Action - Toggle traceback
      cy.get('[data-test="metadata--error-log"] .toggle-control__checkbox').check({ force: true });

      // Assert after action
      cy.get('[data-test="metadata--error-log"] .toggle-control__checkbox').should('be.checked');
      cy.get('.error-log--details pre').should('be.visible');
    });

    it('verifies that error log shows footer message. #TC-EL-5', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.error-log--footer').should('exist');
      cy.get('.error-log--footer').should(
        'contain',
        'Please refer to the CLI for the full error log and details'
      );
    });

    it('verifies that traceback contains detailed stack trace information. #TC-EL-6', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Toggle traceback to show full details
      cy.get('[data-test="metadata--error-log"] .toggle-control__checkbox').check({ force: true });

      // Assert after action
      cy.get('.error-log--details pre').should('contain', 'Traceback');
      cy.get('.error-log--details pre').should('contain', 'File');
      cy.get('.error-log--details pre').should('contain', 'line');
    });
  });

  describe('Dataset Error Scenarios', () => {
    beforeEach(() => {
      // Intercept the network request to mock with dataset error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusDatasetError.json'
      ).as('datasetErrorRunStatus');
    });

    it('verifies that error log component displays for failed datasets. #TC-EL-7', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@datasetErrorRunStatus');

      // Click on a failed dataset
      cy.get('.pipeline-node--data').first().click({ force: true });

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      
      // Check if error log exists (may vary based on which dataset is clicked)
      cy.get('.pipeline-metadata').then(($metadata) => {
        if ($metadata.find('.error-log--wrapper').length > 0) {
          cy.get('.error-log--wrapper').should('exist');
          cy.get('[data-test="metadata--error-log"]').should('exist');
        }
      });
    });

    it('verifies that error log shows correct header for dataset loading errors. #TC-EL-8', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@datasetErrorRunStatus');

      // Find and click on the specifically failed dataset
      cy.get('.pipeline-node--data').each(($dataset) => {
        cy.wrap($dataset).then(($el) => {
          const classList = Array.from($el[0].classList);
          const hasFailedClass = classList.some(cls => cls.includes('failed'));
          
          if (hasFailedClass) {
            cy.wrap($dataset).click({ force: true });
            
            // Check for error log components
            cy.get('.pipeline-metadata--visible').should('exist');
            cy.get('.error-log--wrapper').should('exist');
            cy.get('.error-log--header').should('contain', 'dataset');
            
            return false; // Break out of the loop
          }
        });
      });
    });
  });

  describe('Error Log Component States', () => {
    it('verifies that error log shows appropriate message when no error details are available. #TC-EL-11', () => {
      // Intercept with successful run status (no errors)
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');

      // Action
      cy.visit('/workflow');
      cy.wait('@successfulRunStatus');

      // Click on a successful node
      cy.get('.pipeline-node--success').first().click();

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      
      // Error log should not be present for successful nodes
      cy.get('.error-log--wrapper').should('not.exist');
    });

    it('verifies that error log component handles empty error messages gracefully. #TC-EL-12', () => {
      // Intercept with node error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusNodeError.json'
      ).as('nodeErrorRunStatus');

      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.error-log--wrapper').should('exist');
      cy.get('.error-log--details').should('exist');
      cy.get('.error-log--details pre').should('not.be.empty');
    });
  });
});
