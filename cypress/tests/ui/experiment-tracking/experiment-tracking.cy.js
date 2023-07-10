// All E2E Tests Related to experiment tracking goes here.

describe('Experiment Tracking', () => {
  it('verifies that users can search for a run. #TC-34', () => {
    const searchInput = '2022-09';

    // Action
    cy.get('.search-input__field').type(searchInput);

    // Assert after action
    cy.get('.runs-list-card', { timeout: 10000 })
      .should('exist')
      .should('have.length', 1);
    cy.get('.runs-list-card__title')
      .should('exist')
      .should('contains.text', searchInput);
  });

  it('verifies that users can bookmark a run. #TC-35', () => {
    // Mutations
    cy.__interceptGql__('updateRunDetails', 'updateBookmark');

    // Alias
    cy.get('.runs-list__accordion-header > .accordion__title').as(
      'accordionTitle'
    );

    // Assert before action
    cy.get('@accordionTitle').should('contains.text', 'All');
    cy.get('@accordionTitle').should('have.length', 1);
    cy.get('.runs-list-card__bookmark--solid').should('not.exist');

    // Action
    cy.get('.runs-list-card__bookmark').first().click();

    // Assert after action
    cy.wait('@updateBookmark').its('response.statusCode').should('eq', 200);
    cy.get('@accordionTitle').first().should('contains.text', 'Bookmarked');
    cy.get('@accordionTitle').should('have.length', 2);
    cy.get('.runs-list-card__bookmark--solid').should('exist');
  });

  it('verifies that users can toggle compare runs option. #TC-36', () => {
    // Alias
    cy.get('.switch__input').as('compareRunsToggle');

    // Assert before action
    cy.get('@compareRunsToggle').should('not.be.checked');
    cy.get('.runs-list-card__checked--comparing').should('not.exist');

    // Action
    cy.get('@compareRunsToggle').check({ force: true });

    // Assert after action
    cy.get('@compareRunsToggle').should('be.checked');
    cy.get('.runs-list-card__checked--comparing').should('exist');
  });

  it('verifies that in the comparison mode, the users can select upto 3 different runs. #TC-37', () => {
    const runsSelectedClass = 'runs-list-card__checked--selected';

    // Alias
    cy.get('.switch__input').as('compareRunsToggle');

    // Assert before action
    cy.get(`.${runsSelectedClass}-first`).should('not.exist');
    cy.get('.details-metadata__run--first-run-comparison-view').should(
      'not.exist'
    );
    cy.get('.runs-list-card--disabled').should('not.exist');

    // Action
    cy.get('@compareRunsToggle').check({ force: true });

    // Assert first action
    cy.get(`.${runsSelectedClass}-first`).should('exist');

    // Mutation for two run comparison
    cy.__interceptGql__('getRunData', 'compareTwoRuns');

    // Action and wait
    cy.get(`.${runsSelectedClass}-second`).should('not.exist');
    cy.get(':nth-child(2) > .runs-list-card__checked').click();
    cy.wait('@compareTwoRuns').its('response.statusCode').should('eq', 200);

    // Assert second action
    cy.get(`.${runsSelectedClass}-second`).should('exist');

    // Mutations for three run comparison
    cy.__interceptGql__('getRunData', 'compareThreeRuns');

    // Action and wait
    cy.get(`.${runsSelectedClass}-third`).should('not.exist');
    cy.get(':nth-child(3) > .runs-list-card__checked').click();
    cy.wait('@compareThreeRuns').its('response.statusCode').should('eq', 200);

    // Assert third action
    cy.get(`.${runsSelectedClass}-third`).should('exist');

    // Assert after all actions
    cy.get('.details-metadata__run--first-run-comparison-view').should('exist');
    cy.get('.runs-list-card--disabled').should('exist');
  });

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
