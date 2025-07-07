// All E2E Tests Related to Run Status Notification Component goes here.

describe('Run Status Notification Component', () => {
  // beforeEach(() => {
  //   cy.enablePrettyNames(); // Enable pretty names using the custom command
  //   cy.get('.feature-hints__close').click(); // Close the feature hints
  // });

  describe('Successful Run Notifications', () => {
    beforeEach(() => {
      // Intercept the network request to mock with successful run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusSuccessful.json'
      ).as('successfulRunStatus');
    });

    it('verifies that successful run notification displays with correct styling. #TC-RN-1', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--success').should('exist');
      cy.get('.run-status-notification').should('be.visible');
    });

    it('verifies that successful run notification displays correct status text. #TC-RN-3', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@successfulRunStatus');
      cy.get('.run-status-notification__text').should('exist');
      cy.get('.run-status-notification__text').should(
        'contain',
        'Run execution completed successfully'
      );
    });
  });

  describe('Failed Run Notifications - Node Errors', () => {
    beforeEach(() => {
      // Intercept the network request to mock with node error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusNodeError.json'
      ).as('nodeErrorRunStatus');
    });

    it('verifies that failed run notification displays with correct styling for node errors. #TC-RN-7', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--failed').should('exist');
      cy.get('.run-status-notification').should('be.visible');
    });

    it('verifies that failed run notification displays correct status text for node errors. #TC-RN-9', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@nodeErrorRunStatus');
      cy.get('.run-status-notification__text').should('exist');
      cy.get('.run-status-notification__text').should(
        'contain',
        'Run execution failed'
      );
    });
  });

  describe('Failed Run Notifications - Dataset Errors', () => {
    beforeEach(() => {
      // Intercept the network request to mock with dataset error run status
      cy.__interceptRest__(
        '/api/run-status',
        'GET',
        '/mock/runStatusDatasetError.json'
      ).as('datasetErrorRunStatus');
    });

    it('verifies that failed run notification displays correctly for dataset errors. #TC-RN-12', () => {
      // Action
      cy.visit('/workflow');

      // Assert after action
      cy.wait('@datasetErrorRunStatus');
      cy.get('.run-status-notification').should('exist');
      cy.get('.run-status-notification--failed').should('exist');
      cy.get('.run-status-notification__text').should(
        'contain',
        'Run execution failed'
      );
    });
  });
});
