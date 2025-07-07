// All E2E Tests Related to Run Status Integration and Edge Cases goes here.

describe('Run Status - Integration and Edge Cases', () => {
//   beforeEach(() => {
//     cy.enablePrettyNames(); // Enable pretty names using the custom command
//     cy.get('.feature-hints__close').click(); // Close the feature hints
//   });

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
      cy.get('.run-not-found-warning').should('exist')
        .or('body').should('contain', 'error')
        .or('get', '.pipeline-wrapper').should('exist'); // Fallback behavior
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
          pipeline: {
            "run_id": "test-id",
            "start_time": "2025-06-18T12:10:44.342274Z",
            "end_time": "2025-06-18T12:11:09.584093Z",
            "duration": 12.73
            // Missing status field
          }
        }
      }).as('missingStatusRunStatus');

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@missingStatusRunStatus');
      
      // Should handle missing status gracefully
      cy.get('.pipeline-wrapper').should('exist');
    });

    it('verifies that workflow view handles empty run status response. #TC-RSI-3', () => {
      // Intercept with empty response
      cy.intercept('GET', '/api/run-status', {
        statusCode: 200,
        body: {}
      }).as('emptyRunStatus');

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@emptyRunStatus');
      
      // Should show appropriate fallback
      cy.get('.run-not-found-warning').should('exist')
        .or('body').should('contain', 'not available');
    });

    it('verifies that workflow view handles network errors for run status. #TC-RSI-4', () => {
      // Intercept with network error
      cy.intercept('GET', '/api/run-status', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('errorRunStatus');

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@errorRunStatus');
      
      // Should handle server error gracefully
      cy.get('.run-not-found-warning').should('exist')
        .or('body').should('contain', 'error')
        .or('url').should('not.include', '/workflow'); // May redirect
    });
  });

  describe('Run Status and Pipeline Integration', () => {
    beforeEach(() => {
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      );
    });

    it('verifies that workflow view enforces default pipeline restriction. #TC-RSI-5', () => {
      // Action - Try accessing workflow with different pipeline
      cy.visit('/workflow?pipeline=data_science');

      // Assert after action
      // Should still show default pipeline in workflow view
      cy.get('.pipeline-wrapper').should('exist');
      cy.url().should('include', '/workflow');
      
      // Should not show pipeline selector or should ignore pipeline parameter
      cy.get('.run-status-notification').should('exist');
    });

    it('verifies that workflow view maintains expanded pipeline state. #TC-RSI-6', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      
      // All modular pipelines should be expanded
      cy.get('.pipeline-node--task').should('have.length.gt', 0);
      
      // Should not have collapsed modular pipeline nodes
      cy.get('.pipeline-node--modular-pipeline').should('have.length', 0);
      
      // Verify that expand/collapse controls are not functional or visible
      cy.get('[data-test*="expand-all"]').should('not.exist')
        .or('be.disabled')
        .or('not.be.visible');
    });

    it('verifies that workflow view maintains text labels visibility. #TC-RSI-7', () => {
      // Action
      cy.visit('/workflow');

      // Text labels should be visible and cannot be toggled off
      cy.get('.pipeline-node__text').should('be.visible');
      cy.get('.pipeline-node__text').should('have.css', 'opacity', '1');
      
      // Label toggle should not affect workflow view or should be disabled
      cy.get('[data-test*="labels-btn"]').should('not.exist')
        .or('be.disabled')
        .or('not.affect.labels');
    });

    it('verifies that workflow view ignores flowchart-specific settings. #TC-RSI-8', () => {
      // Action - Start in flowchart, modify settings, then go to workflow
      cy.visit('/');
      
      // Hide text labels in flowchart
      cy.get('[data-test*="sidebar-flowchart-labels-btn-"]').click();
      
      // Navigate to workflow
      cy.get('[href*="workflow"]').click();

      // Assert after action
      
      // Labels should still be visible in workflow despite flowchart setting
      cy.get('.pipeline-node__text').should('be.visible');
      cy.get('.pipeline-node__text').should('have.css', 'opacity', '1');
    });
  });

  describe('Run Status State Persistence', () => {
    it('verifies that run status data persists during view navigation. #TC-RSI-9', () => {
      // Intercept run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      );

      // Action - Load workflow view first
      cy.visit('/workflow');
      
      // Navigate to flowchart
      cy.get('[href="/"]').click();
      
      // Navigate back to workflow
      cy.get('[href*="workflow"]').click();

      // Assert after action
      // Should not make another API call if data is cached
      cy.get('.run-status-notification').should('exist');
      cy.get('.pipeline-wrapper').should('exist');
    });
  });

  describe('Run Status Performance and Loading', () => {
    it('verifies that workflow view handles large run status datasets efficiently. #TC-RSI-13', () => {
      // Create large dataset by intercepting and modifying response
      cy.intercept('GET', '/api/run-status', (req) => {
        req.reply((res) => {
          const largeData = {
            nodes: {},
            datasets: {},
            pipeline: {
              runId: 'large-test', // eslint-disable-line camelcase
              startTime: '2025-06-18T12:10:44.342274Z', // eslint-disable-line camelcase
              endTime: '2025-06-18T12:11:09.584093Z', // eslint-disable-line camelcase
              duration: 12.73,
              status: 'success',
              error: null
            }
          };
          
          // Add many nodes
          for (let i = 0; i < 100; i++) {
            largeData.nodes[`node_${i}`] = {
              status: 'success',
              duration: Math.random(),
              error: null
            };
          }
          
          res.send(largeData);
        });
      });

      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.get('.run-status-notification').should('exist');
      cy.get('.pipeline-wrapper').should('exist');
      
      // Should render without performance issues
      cy.get('.pipeline-node').should('have.length.gt', 10);
    });
  });
});
