// All E2E Tests Related to global-toolbar goes here.

describe('Global Toolbar', () => {
  // Shared variables
  const flowChartClassNames = [
    'pipeline-wrapper',
    'pipeline-nodelist__elements-panel',
    'pipeline-nodelist__filter-panel',
    'pipeline-minimap',
    'pipeline-minimap__graph',
    'pipeline-minimap__viewport',
    'pipeline-flowchart__graph',
  ];
  const experimentTrackingClassNames = [
    'runs-list__wrapper',
    'runs-list-card',
    'details-mainframe',
    'details__tabs',
    'tabs__item',
    'details-metadata',
    'details-dataset',
  ];

  it('verifies that users can access the flowchart page through the flowchart icon, when in the experiment tracking view', function () {
    cy.visit('/experiment-tracking');
    cy.get('[data-test="View your pipeline"]').click();
    cy.get('[data-test="View your pipeline"]')
      .parent()
      .parent()
      .should('have.class', 'active');
    cy.location('pathname').should('eq', '/');

    // should exist
    cy.get('[data-test="kedro-pipeline-selector"]').should('exist');
    cy.get('[role="search"]').should('exist');

    cy.checkClassExistence(flowChartClassNames, 'exist'); // custom command

    // should not exist
    cy.checkClassExistence(experimentTrackingClassNames, 'not.exist'); // custom command
  });

  it('verifies that users can access the experiment tracking page through the experiment tracking button, when in the flowchart view', function () {
    cy.get('[data-test="View your experiments"]').click();
    cy.get('[data-test="View your experiments"]')
      .parent()
      .parent()
      .should('have.class', 'active');
    cy.location('pathname').should('eq', '/experiment-tracking');

    // should exist
    cy.get('[role="search"]').should('exist');
    cy.checkClassExistence(experimentTrackingClassNames, 'exist'); // custom command

    // should not exist
    cy.get('[data-test="kedro-pipeline-selector"]').should('not.exist');
    cy.checkClassExistence(flowChartClassNames, 'not.exist'); // custom command
  });

  it('verifies that users can change the theme from light to dark theme, or dark to light theme', function () {
    cy.get('[data-test="Toggle Theme"]').then(($element) => {
      cy.get('.kui-theme--dark').should('exist');
      cy.get('.kui-theme--light').should('not.exist');
      cy.wrap($element)
        .should('have.attr', 'aria-label')
        .and('eq', 'Change to light theme');

      cy.wrap($element).click();

      cy.get('.kui-theme--light').should('exist');
      cy.get('.kui-theme--dark').should('not.exist');
      cy.wrap($element)
        .should('have.attr', 'aria-label')
        .and('eq', 'Change to dark theme');

      cy.wrap($element).click();
    });
  });

  it('verifies that users can access the settings panel with the settings button', function () {
    cy.get('[data-test="Change the settings flags"]').click();
    cy.get('.pipeline-settings-modal > [role="dialog"]')
      .should('be.visible')
      .then(($dialog) => {
        cy.wrap($dialog)
          .should('have.attr', 'class')
          .and('contains', 'modal--visible');

        cy.wrap($dialog).within(() => {
          cy.get('.modal__title')
            .should('have.class', 'modal__title')
            .should('have.text', 'Settings');
        });

        cy.wrap($dialog)
          .find('[data-test="Cancel Button in Settings Modal"]')
          .click();
      });

    cy.get('.pipeline-settings-modal > [role="dialog"]', {
      timeout: 5000,
    }).should('be.not.visible');
  });

  describe('Settings Panel', () => {
    it('verifies that users can change the display of the names of their kedro nodes', function () {
      cy.get('[data-test="Change the settings flags"]').click();
      cy.get('[data-test="pipeline-toggle-input-isPrettyName"]').as(
        'isPrettyNameCheckbox'
      );

      // Assert that the checkbox is checked
      cy.get('@isPrettyNameCheckbox').should('be.checked');

      // Check if the pipeline names are pretty
      cy.filterElementsByRegex(
        'menu-option__content',
        'title',
        /[_-]/,
        true
      ).then((elements) => {
        expect(elements.length).to.be.eq(0);
      });

      // Check if the node names are pretty
      cy.filterElementsByRegex(
        'pipeline-nodelist__row',
        'title',
        /[_-]/,
        true
      ).then((elements) => {
        expect(elements.length).to.be.eq(0);
      });

      // Check if the metadata panel node name label matches
      cy.get('.pipeline-node__bg').first().click({ force: true });
      cy.get('.pipeline-metadata__properties > :nth-child(1)').should(
        'have.text',
        'Original node name:'
      );

      // Uncheck the checkbox and click on apply changes
      cy.get('@isPrettyNameCheckbox').uncheck({ force: true });
      cy.get('[data-test="Apply changes and close in Settings Modal"]').click();

      cy.waitForPageReload(() => {
        // Check if the pipeline names are original
        cy.filterElementsByRegex(
          'menu-option__content',
          'title',
          /[_-]/,
          true
        ).then((elements) => {
          expect(elements.length).to.be.greaterThan(0);
        });
        // Check if the node names show original names
        cy.filterElementsByRegex(
          'pipeline-nodelist__row',
          'title',
          /[_-]/,
          true
        ).then((elements) => {
          expect(elements.length).to.be.greaterThan(0);
        });
        // Check if the metadata panel node name label matches
        cy.get('.pipeline-node__bg').first().click();
        cy.get('.pipeline-metadata__properties > :nth-child(1)').should(
          'have.text',
          'Pretty node name:'
        );
      });
    });

    // TODO
    it('verifies that users can show a warning before rendering very large graphs', function () {});

    it('verifies that users can expand all modular pipelines on first load', function () {
      cy.get('[data-test="Change the settings flags"]').click();
      cy.get('[data-test="pipeline-toggle-input-expandAllPipelines"]').as(
        'isExpandAllPipelinesCheckBox'
      );
      // Assert that the checkbox is not checked
      cy.get('@isExpandAllPipelinesCheckBox').should('not.be.checked');

      cy.get('[role="treeitem"]')
        .should('have.attr', 'aria-expanded')
        .and('eq', 'false');

      // Uncheck the checkbox and click on apply changes
      cy.get('@isExpandAllPipelinesCheckBox').check({ force: true });
      cy.get('[data-test="Apply changes and close in Settings Modal"]').click();

      cy.waitForPageReload(() => {
        cy.get('[role="treeitem"]')
          .should('have.attr', 'aria-expanded')
          .and('eq', 'true');
      });
    });
  });
});
