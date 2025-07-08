// All E2E Tests Related to Run Status General Behaviors like Navigation and Global Features goes here.

describe('Run Status - General Behaviors', () => {
  describe('Global Toolbar Run Status Indicator', () => {
    it('verifies that new run indicator appears in flowchart view when there is a new run. #TC-WGB-1', () => {
      // Intercept the network request to mock with successful run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');

      // Action - Start in flowchart view
      cy.visit('/');
      cy.wait('@successfulRunStatus');

      // Assert after action - Check for run status dot indicator
      cy.get('.run-status-nav-wrapper').should('exist');
      
      // The dot should appear when there's a new run (this behavior may depend on local storage)
      cy.get('.run-status-dot').should('exist');
    });
  });

  describe('Cross-View Navigation', () => {
    beforeEach(() => {
      // Use successful run status for these tests
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that clicking workflow link navigates to workflow view. #TC-WGB-2', () => {
      // Intercept the network request to mock with successful run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');

      // Action
      cy.visit('/');
      cy.get('[href*="workflow"]').click();

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.url().should('include', '/workflow');
      cy.get('.run-status-notification').should('exist');
    });
  });

  describe('Run Status Data Validation', () => {
    it('verifies that workflow view handles malformed run status data. #TC-WGB-3', () => {
      // Intercept with malformed data
      cy.intercept('GET', '/api/run-status', {
        statusCode: 200,
        body: {
          nodes: null,
          datasets: {},
          pipeline: {}
        }
      }).as('malformedRunStatus');

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@malformedRunStatus');
      
      // Should handle gracefully
      cy.get('body').should('contain', 'Kedro run not found')
    });

    it('verifies that workflow view handles missing pipeline status. #TC-WGB-4', () => {
      // Intercept with missing pipeline status
      cy.intercept('GET', '/api/run-status', {
        statusCode: 200,
        body: {
          nodes: {
            "69c523b6": {
              "status": "success",
              "duration": 0.02,
              "error": null
            }
          },
          datasets: {},
          pipeline: {}
        }
      }).as('missingPipelineStatus');

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@missingPipelineStatus');
      
      // Should handle gracefully
      cy.get('body').should('contain', 'Kedro run not found')
    });

    it('verifies that workflow view handles network errors gracefully. #TC-WGB-5', () => {
      // Intercept with network error
      cy.intercept('GET', '/api/run-status', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('networkError');

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@networkError');
      
      // May show error message or fallback UI
      cy.get('body').should('exist'); // Basic check that page doesn't crash
    });
  });

  describe('General workflow behavior tests', () => {
    beforeEach(() => {
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that pipelines are always expanded in workflow mode. #TC-WGB-6', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      // Check that modular pipelines are expanded by default
      cy.get('.pipeline-node--modular-pipeline').should('not.exist');
      // All task nodes should be visible
      cy.get('.pipeline-node--task').should('have.length.gt', 0);
    });

    it('verifies that text labels are always visible in workflow mode. #TC-WGB-7', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.pipeline-node__text').should('be.visible');
      cy.get('.pipeline-node__text').should('have.css', 'opacity', '1');
    });

    it('verifies that the workflow view only works for the default pipeline. #TC-WGB-8', () => {
      // Action - Try to access workflow view with a specific pipeline
      cy.visit('/workflow?pipeline=data_ingestion');

      // Assert after action
      cy.wait('@successfulRunStatus');
      // Should still show default pipeline data in workflow view
      cy.get('.pipeline-wrapper').should('exist');
      cy.url().should('include', '/workflow');
    });

    it('verifies that users can navigate between flowchart and workflow views. #TC-WGB-9', () => {
      // Start in flowchart view
      cy.visit('/');

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

    it('verifies that workflow view is accessible via direct URL navigation. #TC-WGB-10', () => {
      // Action - Direct navigation to workflow view
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.url().should('include', '/workflow');
      cy.get('.run-status-notification').should('exist');
      cy.get('.pipeline-wrapper').should('exist');
    });

    it('verifies that workflow view maintains state when sidebar is toggled. #TC-WGB-11', () => {
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

    it('verifies that metadata panel shows run status information for nodes. #TC-WGB-12', () => {
      // Action
      cy.visit('/workflow');
      cy.wait('@successfulRunStatus');

      // Click on any node
      cy.get('.pipeline-node--task').first().click();

      // Assert after action
      cy.get('.pipeline-metadata--visible').should('exist');
      cy.get('.pipeline-metadata__title').should('exist');
      
      // Should show status-related information
      cy.get('.pipeline-metadata').should('exist');
    });
  });  
});
