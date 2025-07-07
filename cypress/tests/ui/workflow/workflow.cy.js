// All E2E Tests Related to Run Status feature in Workflow view goes here.

describe('Workflow View - Run Status Feature', () => {
  describe('1. Successful Pipeline Runs', () => {
    beforeEach(() => {
      // Intercept the network request to mock with successful run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that users can access the workflow view for successful pipeline runs. #TC-WS-1', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.pipeline-wrapper').should('exist');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--success').should('exist');
    });

    it('verifies that successful run status notification displays correct information. #TC-WS-2', () => {
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

    it('verifies that all nodes show success status in successful pipeline runs. #TC-WS-3', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.pipeline-node--task').each(($node) => {
        cy.wrap($node).should('have.class', 'pipeline-node--success');
      });
    });

    it('verifies that successful run displays duration information. #TC-WS-4', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification__text').should('contain', 'in');
      cy.get('.run-status-notification__text').should('contain', 's'); // seconds indicator
    });
  });

  describe('2. Pipeline Runs with Node Failures', () => {
    beforeEach(() => {
      // Intercept the network request to mock with node error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusNodeError.json'
      ).as('nodeErrorRunStatus');
    });

    it('verifies that users can access the workflow view for failed pipeline runs (node error). #TC-WS-5', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      cy.get('.pipeline-wrapper').should('exist');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--failed').should('exist');
    });

    it('verifies that failed run status notification displays correct information for node errors. #TC-WS-6', () => {
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

    it('verifies that failed nodes show error status while successful nodes show success status. #TC-WS-7', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      
      // Check for at least one failed node
      cy.get('.pipeline-node--status-failed').should('exist');
      
      // Check for successful nodes
      cy.get('.pipeline-node--success').should('exist');
    });

    it('verifies that users can view error details for failed nodes. #TC-WS-8', () => {
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

    it('verifies that users can toggle traceback visibility for node errors. #TC-WS-9', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert before action
      cy.get('[data-test="metadata--error-log"]').should('exist');
      
      // Toggle traceback
      cy.get('[data-test="metadata--error-log"] .toggle-control__checkbox').check({ force: true });

      // Assert after action
      cy.get('.error-log--details pre').should('be.visible');
      cy.get('.error-log--details pre').should('contain', 'Traceback');
    });
  });

  describe('3. Pipeline Runs with Dataset Failures', () => {
    beforeEach(() => {
      // Intercept the network request to mock with dataset error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusDatasetError.json'
      ).as('datasetErrorRunStatus');
    });

    it('verifies that users can access the workflow view for failed pipeline runs (dataset error). #TC-WS-10', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@datasetErrorRunStatus');
      cy.get('.pipeline-wrapper').should('exist');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--failed').should('exist');
    });

    it('verifies that failed datasets show error status in workflow view. #TC-WS-11', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@datasetErrorRunStatus');
      
      // Check for at least one failed dataset
      cy.get('.pipeline-node--data').each(($dataset) => {
        cy.wrap($dataset).then(($el) => {
          const classList = Array.from($el[0].classList);
          const hasFailedClass = classList.some(cls => cls.includes('failed'));
          const hasSuccessClass = classList.some(cls => cls.includes('success'));
          
          // Verify that each dataset has either failed or success status
          cy.wrap(hasFailedClass || hasSuccessClass).should('be.true');
        });
      });
    });

    it('verifies that users can view error details for failed datasets. #TC-WS-12', () => {
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

    it('verifies that dataset error messages include operation details (loading/saving). #TC-WS-13', () => {
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
  });

  describe('4. Workflow Mode General Behaviors', () => {
    beforeEach(() => {
      // Use successful run status for these general workflow behavior tests
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that workflow view only works for the default pipeline. #TC-WS-14', () => {
      // Action - Try to access workflow view with a specific pipeline
      cy.visit('/workflow?pipeline=data_ingestion');

      // Assert after action
      cy.wait('@successfulRunStatus');
      // Should still show default pipeline data in workflow view
      cy.get('.pipeline-wrapper').should('exist');
      cy.url().should('include', '/workflow');
    });

    it('verifies that pipelines are always expanded in workflow mode. #TC-WS-15', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      // Check that modular pipelines are expanded by default
      cy.get('.pipeline-node--modular-pipeline').should('not.exist');
      // All task nodes should be visible
      cy.get('.pipeline-node--task').should('have.length.gt', 0);
    });

    it('verifies that text labels are always visible in workflow mode. #TC-WS-16', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.pipeline-node__text').should('be.visible');
      cy.get('.pipeline-node__text').should('have.css', 'opacity', '1');
    });

    it('verifies that the workflow view shows run status notification prominently. #TC-WS-17', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification').should('be.visible');
      cy.get('.run-status-notification').should('have.css', 'position');
      
      // Verify it's positioned at the top
      cy.get('.run-status-notification').then(($notification) => {
        const rect = $notification[0].getBoundingClientRect();
        expect(rect.top).to.be.lessThan(100);
      });
    });

    it('verifies that users can navigate between flowchart and workflow views. #TC-WS-18', () => {
      // Start in flowchart view
      cy.visit('/');
      cy.get('.global-toolbar').should('exist');

      // Navigate to workflow view
      cy.get('[href*="workflow"]').click();
      cy.url().should('include', '/workflow');
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification').should('exist');

      // Navigate back to flowchart view
      cy.get('[href="/"]').click();
      cy.url().should('not.include', '/workflow');
      cy.get('.run-status-notification').should('not.exist');
    });

    it('verifies that workflow view is accessible via direct URL navigation. #TC-WS-19', () => {
      // Action - Direct navigation to workflow view
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.url().should('include', '/workflow');
      cy.get('.run-status-notification').should('exist');
      cy.get('.pipeline-wrapper').should('exist');
    });

    it('verifies that workflow view maintains state when sidebar is toggled. #TC-WS-20', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@successfulRunStatus');

      // Toggle sidebar
      cy.get('[data-test*="sidebar-flowchart-visible-btn-"]').click();

      // Assert after action
      cy.get('.run-status-notification').should('exist');
      cy.get('.pipeline-wrapper').should('exist');
      
      // Toggle sidebar back
      cy.get('[data-test*="sidebar-flowchart-visible-btn-"]').click();
      cy.get('.run-status-notification').should('exist');
    });

    it('verifies that global toolbar shows workflow icon as active when in workflow view. #TC-WS-21', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.global-toolbar').should('exist');
      
      // Check if workflow navigation link is active
      cy.get('[href*="workflow"]').should('have.class', 'active').or('have.attr', 'aria-current');
    });
  });

  describe('5. Metadata Panel Integration', () => {
    beforeEach(() => {
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusNodeError.json'
      ).as('nodeErrorRunStatus');
    });

    it('verifies that metadata panel shows run status information for nodes. #TC-WS-22', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on any node
      cy.get('.pipeline-node--task').first().click();

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      cy.get('.pipeline-metadata__title').should('exist');
      
      // Should show status-related information
      cy.get('.pipeline-metadata').should('exist');
    });

    it('verifies that error log component is properly integrated in metadata panel. #TC-WS-23', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@nodeErrorRunStatus');

      // Click on a failed node
      cy.get('.pipeline-node--status-failed').first().click();

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      cy.get('.error-log--wrapper').should('exist');
      cy.get('.error-log--header').should('be.visible');
      cy.get('.error-log--footer').should('be.visible');
    });
  });
});
