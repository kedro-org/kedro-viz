// All E2E Tests Related to experiment tracking goes here.

import { prettifyName, stripNamespace } from '../../../../src/utils';

describe('Experiment Tracking', () => {
  describe('Overview', () => {
    it('verifies that users can edit the run name, apply changes, and see the changes reflected from the overview page. #TC-43', () => {
      const modifiedRunTitleText = '2022-12-25T21.05.59.296Z';

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
          cy.get(':nth-child(2) > .input').clear();
          cy.get(':nth-child(2) > .input').type(modifiedRunTitleText);
          cy.get('@applyChanges').click();
        });
      });

      cy.get('.modal--visible').should('not.exist');
      cy.get('.runs-list-card__title')
        .first()
        .should('have.text', modifiedRunTitleText);
      cy.get('@metadataTitle').should('have.text', modifiedRunTitleText);
    });

    it('verifies that users can add notes to the run, apply changes, and see the changes reflected from the overview page. #TC-44', () => {
      const modifiedRunNotesText = 'Test';

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
          cy.get(':nth-child(3) > .input').clear();
          cy.get(':nth-child(3) > .input').type(modifiedRunNotesText);
          cy.get('@applyChanges').click();
        });
      });

      cy.get('.modal--visible').should('not.exist');
      cy.get('@metadataNotes').should('have.text', modifiedRunNotesText);
    });
  });

  describe('Metrics', () => {
    beforeEach(() => {
      // Go into metrics tab

      // Alias
      cy.get('.details__tabs > :nth-child(2)').as('metricsTab');

      // Action
      cy.get('@metricsTab').click();

      // Assert after action
      cy.get('@metricsTab').should('have.class', 'tabs__item--active');
    });

    it('verifies that in comparison mode time-series view, users can select the run(s) and see it in the plot. #TC-45', () => {
      // Go into comparison mode and select three runs
      cy.__comparisonMode__();

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

    it('verifies that in comparison mode time-series view, users can select/unselect the metrics apply changes, and see the changes in the plot. #TC-46', () => {
      // Go into comparison mode and select three runs
      cy.__comparisonMode__();

      const plotToCheckText =
        'train_evaluation.linear_regression.r_score.a2_score';

      // Assert before action
      cy.get('.time-series__metric-name')
        .first()
        .invoke('text')
        .should((text) => {
          expect(text.trim()).to.be.eq(plotToCheckText.trim());
        });

      // Action
      cy.get('.select-dropdown [data-test="kedro-pipeline-selector"]').click();
      cy.get('.dropdown__options > :nth-child(2)').click();
      cy.get('[data-test="btnMetricsChange"]').click();

      // Assert after action
      cy.get('.time-series__metric-name')
        .first()
        .invoke('text')
        .should((text) => {
          expect(text.trim()).to.be.not.eq(plotToCheckText.trim());
        });
    });

    it('verifies that in comparison mode parallel coordinates view, users can select the run(s) and see it in the plot. #TC-47', () => {
      // Go into comparison mode and select three runs
      cy.__comparisonMode__();

      const runIds = [0, 1, 2];

      // Alias
      cy.get('.chart-types-wrapper > :nth-child(2)').as('parallelView');

      // Action
      cy.get('@parallelView').click();

      // Assert for parallel coordinates plot
      cy.get('@parallelView').should(
        'have.class',
        'chart-types-wrapper__tab--active'
      );
      cy.get('.metric-axis').should('exist');
      cy.get('.run-lines').should('exist');
      runIds.map((id) =>
        cy.get(`.marker-path--selected-${id}`).should('exist')
      );
    });

    it('verifies that in comparison mode parallel coordinates view, users can select/unselect the metrics apply changes, and see the changes in the plot. #TC-48', () => {
      // Go into comparison mode and select three runs
      cy.__comparisonMode__();

      const plotToCheckText =
        'train_evaluation.linear_regression.r_score.a2_score';
      // Alias
      cy.get('.chart-types-wrapper > :nth-child(2)').as('parallelView');
      cy.get('@parallelView').click();

      // Assert before action
      cy.get(`.metric-axis`)
        .should('have.attr', 'id')
        .and('eq', plotToCheckText);

      // Action
      cy.get('.select-dropdown [data-test="kedro-pipeline-selector"]').click();
      cy.get('.dropdown__options > :nth-child(2)').click();
      cy.get('[data-test="btnMetricsChange"]').click();

      // Assert after action
      cy.get(`.metric-axis`)
        .should('have.attr', 'id')
        .and('not.eq', plotToCheckText);
    });
  });

  describe('Plots', () => {
    beforeEach(() => {
      // Go into Plots tab

      // Alias
      cy.get('.details__tabs > :nth-child(3)').as('plotsTab');

      // Action
      cy.get('@plotsTab').click();

      // Assert after action
      cy.get('@plotsTab').should('have.class', 'tabs__item--active');
    });

    it('verifies that users can select the metrics name, and it takes them to the metrics in the DAG. #TC-49', () => {
      const plotNameText = 'reporting.feature_importance';

      // Action
      cy.get('.accordion__title--hyperlink').first().click();

      // Assert after action
      cy.location('search').should('contain', `?pid=__default__&sn=${plotNameText}`);
      cy.__checkForText__(
        '.pipeline-node--selected > .pipeline-node__text',
        prettifyName(stripNamespace(plotNameText))
      );
      cy.__checkForText__(
        '.pipeline-metadata__title',
        prettifyName(stripNamespace(plotNameText))
      );
    });

    it('verifies that in comparison mode in plots tab, users can select the run(s) and see them in the UI. #TC-50', () => {
      // Go into comparison mode and select three runs
      cy.__comparisonMode__();

      // Assert
      cy.get('.details-dataset__row').should('have.length', 4);
      cy.get('.details-dataset__value').should('have.length', 6);
      cy.get('.details-dataset__image').should('have.length', 3);
    });
  });
});
