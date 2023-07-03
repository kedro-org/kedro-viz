// All E2E Tests Related to global-toolbar goes here.

describe('Global Toolbar', () => {
  it('verifies that users can access the flowchart page through the flowchart icon, when in the experiment tracking view. #TC-1', function () {
    cy.visit('/experiment-tracking');
    cy.get('[data-test="View your pipeline"]').click();
    cy.location('pathname').should('eq', '/');

    // should exist
    cy.get('.pipeline-wrapper').should('exist');

    // should not exist
    cy.get('.details__tabs').should('not.exist');
  });

  it('verifies that users can access the experiment tracking page through the experiment tracking button, when in the flowchart view. #TC-2', function () {
    cy.get('[data-test="View your experiments"]').click();
    cy.location('pathname').should('eq', '/experiment-tracking');

    // should exist
    cy.get('.details__tabs').should('exist');

    // should not exist
    cy.get('.pipeline-wrapper').should('not.exist');
  });

  it('verifies that users can change the theme from light to dark theme, or dark to light theme. #TC-3', function () {
    // Alias
    cy.get('[data-test="Toggle Theme"]').as('toggleTheme');

    // Assert before action
    cy.get('.kui-theme--dark').should('exist');
    cy.__checkForAriaLabel__('@toggleTheme', 'Change to light theme');

    // Action
    cy.get('@toggleTheme').click();

    // Assert after action
    cy.get('.kui-theme--light').should('exist');
    cy.__checkForAriaLabel__('@toggleTheme', 'Change to dark theme');
  });

  it('verifies that users can access the settings panel with the settings button. #TC-4', function () {
    cy.get('[data-test="Change the settings flags"]').click();
    cy.get('.pipeline-settings-modal > [role="dialog"]')
      .should('be.visible')
      .then(($dialog) => {
        cy.wrap($dialog)
          .should('have.attr', 'class')
          .and('contains', 'modal--visible');

        cy.wrap($dialog).within(() => {
          cy.get('.modal__title').should('have.text', 'Settings');
        });
      });
  });

  describe('Settings Panel', () => {
    it('verifies that users can change the display of the names of their kedro nodes. #TC-5', function () {
      // Alias
      cy.get('[data-test="pipeline-toggle-input-isPrettyName"]').as(
        'isPrettyNameCheckbox'
      );

      // Assert before action
      cy.get('@isPrettyNameCheckbox').should('be.checked');

      // Check if the pipeline name is pretty
      cy.get(':nth-child(1) > .menu-option__content')
        .should('have.attr', 'title')
        .should('not.match', /[_-]/);

      // Check if the metadata panel node name label matches
      cy.get('.pipeline-node__bg').first().click({ force: true });
      cy.get('.pipeline-metadata__properties > :nth-child(1)').should(
        'have.text',
        'Original node name:'
      );

      // Action
      cy.get('@isPrettyNameCheckbox').uncheck({ force: true });
      cy.get('[data-test="Apply changes and close in Settings Modal"]').click({
        force: true,
      });

      // Assert after action
      cy.__waitForPageLoad__(() => {
        // Check if the pipeline name is original
        cy.get(':nth-child(1) > .menu-option__content')
          .should('have.attr', 'title')
          .should('match', /[_-]/);

        // Check if the metadata panel node name label matches
        cy.get('.pipeline-node__bg').first().click();
        cy.get('.pipeline-metadata__properties > :nth-child(1)').should(
          'have.text',
          'Pretty node name:'
        );
      });
    });

    it('verifies that users can show a warning before rendering very large graphs. #TC-6', function () {
      // Alias
      cy.get('[data-test="pipeline-toggle-input-sizewarning"]').as(
        'isSizeWarning'
      );

      // Assert before action
      cy.get('@isSizeWarning').should('be.checked');

      // Intercept the network request to mock with a fixture
      cy.__interceptRest__('/api/main', 'GET', '/mock/largeDataset.json');
      cy.reload();

      cy.__waitForPageLoad__(() => {
        cy.get('.pipeline-warning__title')
          .should('exist')
          .and('have.text', 'Whoa, that’s a chonky pipeline!');
      });

      // Action
      cy.get('@isSizeWarning').uncheck({ force: true });
      cy.get('[data-test="Apply changes and close in Settings Modal"]').click({
        force: true,
      });

      // Assert after action
      cy.__waitForPageLoad__(() => {
        cy.get('.pipeline-warning__title').should('not.exist');
      });
    });

    it('verifies that users can expand all modular pipelines on first load. #TC-7', function () {
      // Alias
      cy.get('[data-test="pipeline-toggle-input-expandAllPipelines"]').as(
        'isExpandAllPipelinesCheckBox'
      );

      // Assert before action
      cy.get('@isExpandAllPipelinesCheckBox').should('not.be.checked');

      cy.get('[role="treeitem"]')
        .should('have.attr', 'aria-expanded')
        .and('eq', 'false');

      // Action
      cy.get('@isExpandAllPipelinesCheckBox').check({ force: true });
      cy.get('[data-test="Apply changes and close in Settings Modal"]').click({
        force: true,
      });

      // Assert after action
      cy.__waitForPageLoad__(() => {
        cy.get('[role="treeitem"]')
          .should('have.attr', 'aria-expanded')
          .and('eq', 'true');
      });
    });
  });
});
