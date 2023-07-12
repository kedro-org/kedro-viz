// All E2E Tests Related to experiment tracking goes here.

describe('Experiment Tracking', () => {
  describe('Overview', () => {
    it('verifies that users can edit the run name, apply changes, and see the changes reflected from the overview page. #TC-43', () => {
      const modifiedRunTitleText = '2022-12-25T21.05.59.296Z';

      // Mutations
      cy.__interceptGql__('updateRunDetails', 'updateRunTitle');

      // Alias
      cy.get('.details-metadata__title').first().as('metadataTitle');
      cy.get('[data-test="Apply changes and close in Run Details Modal"]').as(
        'applyChanges'
      );

      // Assert before action
      cy.get('.modal--visible').should('not.exist');

      // Action
      cy.get('@metadataTitle').click();

      // Assert after action
      cy.get('.modal--visible').then(($dialog) => {
        cy.wrap($dialog).within(() => {
          cy.get(':nth-child(2) > .input').type(
            `{selectall}{backspace}${modifiedRunTitleText}`,
            { force: true }
          );
          cy.get('@applyChanges').click();
        });
      });

      cy.get('.modal--visible').should('not.exist');
      cy.wait('@updateRunTitle').its('response.statusCode').should('eq', 200);
      cy.get('.runs-list-card__title')
        .first()
        .should('have.text', modifiedRunTitleText);
      cy.get('@metadataTitle').should('have.text', modifiedRunTitleText);
    });

    it('verifies that users can add notes to the run, apply changes, and see the changes reflected from the overview page. #TC-44', () => {
      const modifiedRunNotesText = 'Test';

      // Mutations
      cy.__interceptGql__('updateRunDetails', 'updateRunNotes');

      // Alias
      cy.get('.details-metadata__notes').as('metadataNotes');
      cy.get('[data-test="Apply changes and close in Run Details Modal"]').as(
        'applyChanges'
      );

      // Assert before action
      cy.get('.modal--visible').should('not.exist');

      // Action
      cy.get('@metadataNotes').click();

      // Assert after action
      cy.get('.modal--visible').then(($dialog) => {
        cy.wrap($dialog).within(() => {
          cy.get(':nth-child(3) > .input').type(
            `{selectall}{backspace}${modifiedRunNotesText}`,
            { force: true }
          );
          cy.get('@applyChanges').click();
        });
      });

      cy.get('.modal--visible').should('not.exist');
      cy.wait('@updateRunNotes').its('response.statusCode').should('eq', 200);
      cy.get('@metadataNotes').should('have.text', modifiedRunNotesText);
    });
  });

  describe.only('Metrics in comparison mode', () => {
    beforeEach(() => {
      // Go into comparison mode and select three runs

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

      // Go into metrics tab
      cy.get('.details__tabs > :nth-child(2)').as('metricsTab');

      // Assert if the user is on metrics tab
      cy.get('@metricsTab').click();
      cy.get('@metricsTab').should('have.class', 'tabs__item--active');
    });

    it.only('verifies that users can select the run(s) in comparison mode in the time-series view and see it in the plot #TC-43', () => {
      const runIds = [0, 1, 2];

      // Assert for time series plot
      cy.get(':nth-child(1) > .chart-types-wrapper__tab').should(
        'have.class',
        'chart-types-wrapper__tab--active'
      );
      runIds.map((id) =>
        cy.get(`.time-series__run-line--selected-${id}`).should('exist')
      );
      runIds.map((id) =>
        cy.get(`.time-series__marker--selected-${id}`).should('exist')
      );
    });

    // In comparison mode in the time-series tab, verify that users can select/unselect the metrics apply changes, and see the change in the plot.
    // In comparison mode in the parallel coordinates tab, verify that users can select the run(s) and see it in the plot.
    // In comparison mode in the parallel coordinates tab, verify that users can select/unselect the metrics apply changes, and see the changes in the plot.
  });

  describe('Plots', () => {
    // Verify that users can select the metrics name, and it takes them to the metrics in the DAG.
    // In comparison mode in the plots tab, verify that users can select the run(s) and see them shown UI.
  });
});
