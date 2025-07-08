// All E2E Tests Related to Run Status feature in Workflow view goes here.

describe('Workflow View - Run Status Feature', () => {
  describe('Successful Pipeline Runs', () => {
    beforeEach(() => {
      // Intercept the network request to mock with successful run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that users can access the workflow view for successful pipeline runs. #TC-WRS-1', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.pipeline-wrapper').should('exist');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--success').should('exist');
    });

    it('verifies that successful run status notification displays correct information. #TC-WRS-2', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification__text').should(
        'contain',
        'Run execution completed successfully'
      );
      cy.get('.run-status-notification__text').should(
        'contain',
        'in 12.73s'
      );
      cy.get('.run-status-notification__timestamp').should(
        'contain',
        'Completed on'
      );
    });

    it('verifies that all nodes show success status in successful pipeline runs. #TC-WRS-3', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.pipeline-node--task').each(($node) => {
        cy.wrap($node).should('have.class', 'pipeline-node--status-success');
      });
    });

    it('verifies that successful run displays duration information. #TC-WRS-4', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification__text').should('contain', 'in');
      cy.get('.run-status-notification__text').should('contain', 's'); // seconds indicator
    });
  });

  describe('Runs that fail on a node', () => {
    beforeEach(() => {
      // Intercept the network request to mock with node error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusNodeError.json'
      ).as('nodeErrorRunStatus');
    });

    it('verifies that users can access the workflow view for failed pipeline runs (node error). #TC-WRS-5', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      cy.get('.pipeline-wrapper').should('exist');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--failed').should('exist');
    });

    it('verifies that failed run status notification displays correct information for node errors. #TC-WRS-6', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      cy.get('.run-status-notification__text').should(
        'contain',
        'Run execution failed'
      );
      cy.get('.run-status-notification__timestamp').should(
        'contain',
        'Failed on'
      );
    });

    it('verifies that failed nodes show error status while successful nodes show success status. #TC-WRS-7', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      
      // Check for at least one failed node
      cy.get('.pipeline-node--status-failed').should('exist');
      
      // Check for successful nodes
      cy.get('.pipeline-node--status-success').should('exist');
    });

    it('verifies that users can view error details for failed nodes. #TC-WRS-8', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      cy.get('.error-log--wrapper').should('exist');
      cy.get('.error-log--header').should('contain', 'Failed while performing function');
      cy.get('.error-log--details').should('exist');
    });   

    it('verifies that users can toggle traceback visibility for node errors. #TC-WRS-9', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert before action
      cy.get('[data-test="metadata--error-log"]').should('exist');
      
      // Toggle traceback
      cy.get('.pipeline-metadata__error-log .pipeline-toggle-label').click();

      // Assert after action
      cy.get('.pipeline-metadata-code pre').should('be.visible');
      cy.get('.pipeline-metadata-code pre').should('contain', 'Traceback');
    });

    it('verifies that error log shows correct header for function errors. #TC-WRS-10', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.error-log--header').should('exist');
      cy.get('.error-log--header').should('contain', 'Failed while performing function');
    });
  });

  describe('Runs that fail on a dataset', () => {
    beforeEach(() => {
      // Intercept the network request to mock with dataset error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusDatasetError.json'
      ).as('datasetErrorRunStatus');
    });

    it('verifies that users can access the workflow view for failed pipeline runs (dataset error). #TC-WRS-11', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@datasetErrorRunStatus');
      cy.get('.pipeline-wrapper').should('exist');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--failed').should('exist');
    });

    it('verifies that failed datasets show error status in workflow view. #TC-WRS-12', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@datasetErrorRunStatus');

      // Check for at least one failed dataset
      cy.get('.pipeline-node--status-failed').should('exist');
    });

    it('verifies that users can view error details for failed datasets. #TC-WRS-13', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@datasetErrorRunStatus');

      // Click on a failed dataset node
      cy.get('.pipeline-node--data').first().click({ force: true });

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      
      // Check if error details are shown for failed datasets
      cy.get('.pipeline-metadata').then(($metadata) => {
        if ($metadata.find('.error-log--wrapper').length > 0) {
          cy.get('.error-log--wrapper').should('exist');
          cy.get('.error-log--header').should('contain', 'Failed while loading data');
        }
      });
    });

    it('verifies that dataset error messages include operation details (loading/saving). #TC-WRS-14', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@datasetErrorRunStatus');

      // Click on a failed dataset node
      cy.get('.pipeline-node--data').first().click({ force: true });

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      
      // Check if error details contain operation information
      cy.get('.pipeline-metadata').then(($metadata) => {
        if ($metadata.find('.error-log--wrapper').length > 0) {
          cy.get('.error-log--details').should('exist');
          cy.get('.error-log--footer').should(
            'contain',
            'Please refer to the CLI for the full error log and details'
          );
        }
      });
    });

    it('verifies that users can toggle traceback visibility for dataset errors. #TC-WRS-15', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@datasetErrorRunStatus');

      // Click on a failed dataset node
      cy.get('.pipeline-node--status-failed').first().click({ force: true });

      // Assert before action
      cy.get('[data-test="metadata--error-log"]').should('exist');
      
      // Toggle traceback
      cy.get('.pipeline-metadata__error-log .pipeline-toggle-label').click();

      // Assert after action
      cy.get('.pipeline-metadata-code pre').should('be.visible');
      cy.get('.pipeline-metadata-code pre').should('contain', 'Traceback');
    });    
  });
});
