// All E2E Tests Related to Experiment Tracking Menu goes here.

describe('Experiment Tracking Menu', () => {
  it('verifies that users can search for a run. #TC-34', () => {
    const searchInput = '2022-09';

    // Action
    cy.get('.search-input__field').type(searchInput);

    // Assert after action
    cy.get('.runs-list-card', { timeout: 5000 })
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
});
