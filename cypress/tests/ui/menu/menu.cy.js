// All E2E Tests Related to menu goes here.

import { prettifyName } from '../../../../src/utils';

describe('Menu', () => {
  it('verifies that users can select a section of the flowchart, through the drop down. #TC-16', function () {
    // Alias
    cy.intercept('GET', '/api/pipelines/*').as('pipelineRequest');
    cy.get(':nth-child(2) > .menu-option__content > span').as('menuOption');

    let menuOptionValue;

    cy.get('@menuOption')
      .invoke('text')
      .then((menuOptionText) => {
        menuOptionValue = menuOptionText;
      });

    // Action
    cy.get('[data-test="kedro-pipeline-selector"]').click();
    cy.get('@menuOption').click({ force: true });

    // Adding an extra wait time due to flakiness
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);

    // Assert after action
    cy.wait('@pipelineRequest').then((interception) => {
      // API Request URL
      const requestUrl = interception.request.url;
      expect(decodeURIComponent(requestUrl).toLowerCase()).to.include(
        `/api/pipelines/${menuOptionValue.toLowerCase()}`
      );

      // Browser URL
      cy.url().then((url) => {
        const decodedURI = decodeURIComponent(url);
        const queryParamValue = decodedURI.split('?')[1].split('=')[1];
        expect(queryParamValue.toLowerCase()).to.be.eq(
          menuOptionValue.toLowerCase()
        );
      });

      // Pipeline Label in the Menu
      cy.get('.pipeline-nodelist__row__label')
        .first()
        .invoke('text')
        .then((pipelineLabel) => {
          expect(menuOptionValue.toLowerCase()).to.include(
            pipelineLabel.toLowerCase()
          );
        });
    });
  });

  it('verifies that users can search/filter for a flowchart component using the search box. #TC-17', function () {
    const searchInput = 'Ingestion';
    cy.get('.search-input__field').type(searchInput);

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);

    // Pipeline Label in the Menu
    cy.get('.pipeline-nodelist__row__label')
      .first()
      .invoke('text')
      .then((pipelineLabel) => {
        expect(searchInput.toLowerCase()).to.include(
          pipelineLabel.toLowerCase()
        );
      });
  });

  it('verifies that users can select a node/dataset/parameters from the menu. #TC-18', function () {
    const nodeToClickText = 'Companies';

    // Action
    cy.get(`[data-test=node-${nodeToClickText}]`)
      .should('exist')
      .as('nodeToClick');
    cy.get('@nodeToClick').click();

    // Assert after action
    cy.__checkForText__(
      '.pipeline-node--selected > .pipeline-node__text',
      nodeToClickText
    );
    cy.__checkForText__('.pipeline-metadata__title', nodeToClickText);
  });

  it('verifies that users can highlight a node/dataset/parameters from the menu by hovering on their name. #TC-19', function () {
    const nodeToHighlightText = 'Companies';

    // Action
    cy.get(`[data-test=node-${nodeToHighlightText}]`)
      .should('exist')
      .as('nodeToHighlight');
    cy.__hover__('@nodeToHighlight');

    // Assert after action
    cy.__checkForText__(
      '.pipeline-node--active > .pipeline-node__text',
      nodeToHighlightText
    );
  });

  it('verifies that users can hide/show a node/dataset/parameters in the flowchart, by clicking on the eye icon. #TC-20', function () {
    const nodeToToggleText = 'Companies';

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${nodeToToggleText}]`).as(
      'nodeToToggle'
    );

    // Assert before action
    cy.get('@nodeToToggle').should('be.checked');
    cy.get('.pipeline-node__text').contains(nodeToToggleText);

    // Action
    cy.get('@nodeToToggle').uncheck({ force: true });

    // Assert after action
    cy.__checkForText__(
      `[data-test=node-${nodeToToggleText}] > .pipeline-nodelist__row__label--faded`,
      nodeToToggleText
    );
    cy.get('.pipeline-node__text').should('not.contain', nodeToToggleText);
  });

  it('verifies that users can select and only show a node/dataset/parameters in the flowchart, by clicking on the box icon. #TC-21', function () {
    const nodeToFocusText = 'feature_engineering';

    // Action
    cy.get(
      `[for=${nodeToFocusText}-focus] > .pipeline-nodelist__row__icon`
    ).click();

    // Assert after action
    cy.__checkForText__(
      '.pipeline-node--active > .pipeline-node__text',
      prettifyName(nodeToFocusText)
    );
  });

  it('verifies that users can filter/hide an element type. #TC-22', function () {
    const nodeToToggleText = 'Datasets';
    const visibleRowLabel = 'Companies';

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${nodeToToggleText}]`).as(
      'nodeToToggle'
    );

    // Assert before action
    cy.get('@nodeToToggle').should('be.checked');
    cy.get(
      `[data-test=node-${visibleRowLabel}] > .pipeline-nodelist__row__label`
    )
      .should('not.have.class', 'pipeline-nodelist__row__label--faded')
      .should('not.have.class', 'pipeline-nodelist__row__label--disabled');

    // Action
    cy.get('@nodeToToggle').uncheck({ force: true });

    // Assert after action
    cy.get(
      `[data-test=node-${visibleRowLabel}] > .pipeline-nodelist__row__label`
    )
      .should('have.class', 'pipeline-nodelist__row__label--faded')
      .should('have.class', 'pipeline-nodelist__row__label--disabled');
  });
});
