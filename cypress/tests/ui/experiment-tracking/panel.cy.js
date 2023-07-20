// All E2E Tests Related to Experiment Tracking Primary Toolbar goes here.

describe('Experiment Tracking Primary Toolbar', () => {
  it('verifies that users can hide/show the side menu. #TC-38', () => {
    // Alias
    cy.get('[data-test="btnToggleMenu"]').as('btnToggleMenu');
    cy.get('.pipeline-sidebar--visible').as('pipelineSideBar');

    // Assert before action
    cy.__checkForAriaLabel__('@btnToggleMenu', 'Hide menu');
    cy.get('@pipelineSideBar').should('exist');

    // Action
    cy.get('@btnToggleMenu').click();

    // Assert after action
    cy.__checkForAriaLabel__('@btnToggleMenu', 'Show menu');
    cy.get('@pipelineSideBar').should('not.exist');
  });

  it('verifies that users can bookmark a run using the bookmark button in the options panel. #TC-39', () => {
    const runGitShaText = '5f81cb5';

    // Mutations
    cy.__interceptGql__('updateRunDetails', 'updateBookmark');

    // Alias
    cy.get('[data-test="btnToggleBookmark"]').as('btnToggleBookmark');
    cy.get('.runs-list__accordion-header > .accordion__title').as(
      'accordionTitle'
    );

    // Assert before action
    cy.get('@btnToggleBookmark').should(
      'not.contains.class',
      'pipeline-icon-toolbar__button--active'
    );
    cy.get('@accordionTitle').should('have.length', 1);

    // Action
    cy.get('@btnToggleBookmark').click();

    // Assert after action
    cy.wait('@updateBookmark').its('response.statusCode').should('eq', 200);
    cy.get('@accordionTitle').first().should('contains.text', 'Bookmarked');
    cy.get('@accordionTitle').should('have.length', 2);
    cy.get('@btnToggleBookmark').should(
      'contains.class',
      'pipeline-icon-toolbar__button--active'
    );
    cy.get('.runs-list-card__gitsha')
      .first()
      .should('have.text', runGitShaText);
    cy.get(
      '.details-metadata__run--wrapper > .details-metadata__run > :nth-child(4)'
    ).should('have.text', runGitShaText);
  });

  it('verifies that users can edit the details of a run by using the ‘Edit details’ button in the options panel. #TC-40', () => {
    const modifiedRunTitleText = '2022-12-25T21.05.59.296Z';
    const modifiedRunNotesText = 'Test';

    // Mutations
    cy.__interceptGql__('updateRunDetails', 'updateRunContent');

    // Alias
    cy.get('[data-test="btnEditRunDetails"]').as('btnEditRunDetails');
    cy.get('[data-test="Apply changes and close in Run Details Modal"]').as(
      'applyChanges'
    );

    // Assert before action
    cy.get('.modal--visible').should('not.exist');

    // Action
    cy.get('@btnEditRunDetails').click();

    // Assert after action
    cy.get('.modal--visible').then(($dialog) => {
      cy.wrap($dialog).within(() => {
        cy.get('.modal__title').should('have.text', 'Edit run details');
        cy.get(
          ':nth-child(2) > .pipeline-settings-modal__header > .pipeline-settings-modal__name'
        ).should('have.text', 'Run name');
        cy.get(
          ':nth-child(3) > .pipeline-settings-modal__header > .pipeline-settings-modal__name'
        ).should('have.text', 'Notes');

        cy.get(':nth-child(2) > .input').type(
          `{selectall}{backspace}${modifiedRunTitleText}`,
          { force: true }
        );
        cy.get(':nth-child(3) > .input').type(
          `{selectall}{backspace}${modifiedRunNotesText}`,
          { force: true }
        );

        cy.get('@applyChanges').click();
      });
    });

    cy.get('.modal--visible').should('not.exist');
    cy.wait('@updateRunContent').its('response.statusCode').should('eq', 200);
    cy.get('.runs-list-card__title')
      .first()
      .should('have.text', modifiedRunTitleText);
    cy.get('.details-metadata__notes').should(
      'have.text',
      modifiedRunNotesText
    );
  });

  it('verifies that users can export the selected run data, using the ‘Export run data’ button. #TC-41', () => {
    const exportRunTitleText = '2022-12-24T21.05.59.296Z';

    // Alias
    cy.get('[data-test="btnExportRunData"]').as('btnExportRunData');
    cy.get('[data-test="Export all and close"]').as('btnExportAll');

    // Action
    cy.get('@btnExportRunData').click();

    // Assert after action
    cy.get('.modal--visible').then(($dialog) => {
      cy.wrap($dialog).within(() => {
        cy.get('.modal__title').should('have.text', 'Export experiment run');
        cy.get('@btnExportAll').click();
      });
    });

    cy.get('.modal--visible').should('not.exist');
    cy.__validateCsv__('run-data.csv', ['Title', exportRunTitleText]);
  });

  it('verifies that in the comparison mode, users can disable/enable the metrics changes  using the ‘disable/enable show changes’ button. #TC-42', () => {
    // Alias
    cy.get('.switch__input').as('compareRunsToggle');

    // Action
    cy.get('@compareRunsToggle').check({ force: true });

    // Assert in comparison mode before selecting multiple runs
    cy.get('[data-test="btnToggleChange"]').as('btnToggleChange');
    cy.get('@btnToggleChange').should('have.attr', 'disabled');

    // Mutation for two run comparison
    cy.__interceptGql__('getRunData', 'compareTwoRuns');

    // Action and wait
    cy.get(':nth-child(2) > .runs-list-card__checked').click();
    cy.wait('@compareTwoRuns').its('response.statusCode').should('eq', 200);

    // Assert in comparison mode
    cy.get('@btnToggleChange').should('not.have.attr', 'disabled');
    cy.get('.details-dataset__deltaValue').should('exist');
    cy.get('.dataset-arrow-icon').should('exist');

    // Toggle Change
    cy.get('@btnToggleChange').click();

    // Assert after toggle action
    cy.get('.details-dataset__deltaValue').should('not.exist');
    cy.get('.dataset-arrow-icon').should('not.exist');
  });
});
