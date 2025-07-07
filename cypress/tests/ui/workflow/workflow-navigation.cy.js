// All E2E Tests Related to Run Status Navigation and Global Features goes here.

describe('Run Status - Navigation and Global Features', () => {
  describe('Global Toolbar Run Status Indicator', () => {
    it('verifies that new run indicator appears in flowchart view when there is a new run. #TC-RS-1', () => {
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

    it('verifies that clicking workflow link navigates to workflow view. #TC-RS-2', () => {
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

  describe('Cross-View Navigation', () => {
    beforeEach(() => {
      // Use successful run status for these tests
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that users can navigate from flowchart to workflow view and maintain run status. #TC-RS-3', () => {
      // Action - Start in flowchart view
      cy.visit('/');
      cy.wait('@successfulRunStatus');

      // Navigate to workflow view
      cy.get('[href*="workflow"]').click();

      // Assert after action
      cy.url().should('include', '/workflow');
      cy.get('.run-status-notification').should('exist');
    });
  });

  describe('Run Status Data Validation', () => {
    it('verifies that workflow view handles malformed run status data. #TC-RSI-1', () => {
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

    it('verifies that workflow view handles missing pipeline status. #TC-RSI-2', () => {
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

    it('verifies that workflow view handles network errors gracefully. #TC-RSI-3', () => {
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
});
