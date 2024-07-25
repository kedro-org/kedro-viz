// All E2E Tests Related to Flowchart Menu goes here.

describe('Flowchart Menu', () => {
  beforeEach(() => {
    cy.enablePrettyNames(); // Enable pretty names using the custom command
    cy.wait(500);
    cy.get('.feature-hints__close').click(); // Close the feature hints so can click on a node
    cy.wait(500);
  });

  it('verifies that users can select a section of the flowchart through the drop down. #TC-16', () => {
    // Alias
    cy.intercept('GET', '/api/pipelines/*').as('pipelineRequest');
    cy.get('.pipeline-list :nth-child(2) > .menu-option__content > span').as(
      'menuOption'
    );

    let menuOptionValue;

    cy.get('@menuOption')
      .invoke('text')
      .then((menuOptionText) => {
        menuOptionValue = menuOptionText;
      });

    // Action
    cy.get('.pipeline-list [data-test="kedro-pipeline-selector"]').click();
    cy.get('@menuOption').click({ force: true });

    // Assert after action
    cy.wait('@pipelineRequest').then((interception) => {
      // API Request URL
      cy.wrap(
        decodeURIComponent(interception.request.url).toLowerCase()
      ).should('contains', `/api/pipelines/${menuOptionValue.toLowerCase()}`);

      cy.location('search').should((queryParams) => {
        expect(decodeURIComponent(queryParams).toLowerCase()).to.contain(
          menuOptionValue.toLowerCase().replace(/ /g, '+')
        );
      });

      // Pipeline Label in the Menu
      cy.get('.pipeline-nodelist__row__label')
        .first()
        .invoke('text')
        .should((pipelineLabel) => {
          expect(menuOptionValue.toLowerCase()).to.include(
            pipelineLabel.toLowerCase()
          );
        });
    });
  });

  it('verifies that users can search/filter for a flowchart component using the search box. #TC-17', () => {
    const searchInput = 'Ingestion';
    cy.get('.search-input__field').type(searchInput, { force: true });

    // Pipeline Label in the Menu
    cy.get('.pipeline-nodelist__row__label')
      .first()
      .invoke('text')
      .should((pipelineLabel) => {
        expect(searchInput.toLowerCase()).to.include(
          pipelineLabel.toLowerCase()
        );
      });
  });

  it('verifies that users can select a node/dataset/parameters from the menu. #TC-18', () => {
    const nodeToClickText = 'Companies';

    // Action
    cy.get(
      `.MuiTreeItem-label > .pipeline-nodelist__row > [data-test=nodelist-data-${nodeToClickText}]`
    )
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

  it('verifies that users can highlight a node/dataset/parameters from the menu by hovering on their name. #TC-19', () => {
    const nodeToHighlightText = 'Companies';

    // Action
    cy.get(
      `.MuiTreeItem-label > .pipeline-nodelist__row > [data-test=nodelist-data-${nodeToHighlightText}]`
    )
      .should('exist')
      .as('nodeToHighlight');
    cy.__hover__('@nodeToHighlight');

    // Assert after action
    cy.__checkForText__(
      '.pipeline-node--active > .pipeline-node__text',
      nodeToHighlightText
    );
  });

  it('verifies that users can hide/show a node/dataset/parameters in the flowchart, by clicking on the eye icon. #TC-20', () => {
    const nodeToToggleText = 'Companies';

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${nodeToToggleText}]`, {
      timeout: 5000,
    }).as('nodeToToggle');

    // Assert before action
    cy.get('@nodeToToggle').should('be.checked');
    cy.get('.pipeline-node__text').contains(nodeToToggleText);

    // Action
    cy.get('@nodeToToggle').uncheck({ force: true });

    // Assert after action
    cy.__checkForText__(
      `[data-test=nodelist-data-${nodeToToggleText}] > .pipeline-nodelist__row__label--faded`,
      nodeToToggleText
    );
    cy.get('.pipeline-node__text').should('not.contain', nodeToToggleText);
  });

  it('verifies that users can select and only show a node/dataset/parameters in the flowchart, by clicking on the focus mode. #TC-21', () => {
    const nodeToFocusText = 'feature_engineering';

    // Assert before action
    cy.get('.pipeline-node', { timeout: 5000 })
      .should('exist')
      .and('not.have.length', 5);

    // Action
    cy.get(
      `[for=${nodeToFocusText}-focus] > .pipeline-nodelist__row__icon`
    ).click();

    // Assert after action
    cy.get('.pipeline-node--active > .pipeline-node__text')
      .invoke('text')
      .then((focusedNodesText) =>
        expect(focusedNodesText.toLowerCase()).to.contains(
          nodeToFocusText
        )
      );
    cy.get('.pipeline-node--active > .pipeline-node__text').should(
      'have.length',
      5
    );

    cy.get('.pipeline-node').should('have.length', 5);
  });

  it('verifies that users can filter/hide an element type. #TC-22', () => {
    const nodeToToggleText = 'Datasets';
    const visibleRowLabel = 'Companies';

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${nodeToToggleText}]`).as(
      'nodeToToggle'
    );

    // Assert before action
    cy.get('@nodeToToggle').should('be.checked');
    cy.get(
      `[data-test=nodelist-data-${visibleRowLabel}] > .pipeline-nodelist__row__label`
    )
      .should('not.have.class', 'pipeline-nodelist__row__label--faded')
      .should('not.have.class', 'pipeline-nodelist__row__label--disabled');

    // Action
    cy.get('@nodeToToggle').uncheck({ force: true });

    // Assert after action
    cy.get(
      `[data-test=nodelist-data-${visibleRowLabel}] > .pipeline-nodelist__row__label`
    )
      .should('have.class', 'pipeline-nodelist__row__label--faded')
      .should('have.class', 'pipeline-nodelist__row__label--disabled');
  });

  it('verifies that after checking node type URL should be updated with correct query params', () => {
    const nodeToToggleText = 'Parameters';

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${nodeToToggleText}]`).as(
      'nodeToToggle'
    );

    // Assert before action
    cy.get('@nodeToToggle').should('not.be.checked');

    // Action
    cy.get('@nodeToToggle').check({ force: true });

    // Assert after action
    cy.url().should('include', 'parameters');
  });

  it('Verify that if the URL contains the nodeTag query parameter, the same parameter should be reflected on the UI.', () => {
    const visibleRowLabel = 'companies';
    cy.visit(`/?tags=${visibleRowLabel}`);

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${visibleRowLabel}]`).as(
      'nodeToToggle'
    );

    // Assert
    cy.get('@nodeToToggle').should('be.checked');
  });

  it('Verify that if the URL contains the nodeType query parameter, the same parameter should be reflected on the UI.', () => {
    const visibleRowLabel = 'Datasets';
    cy.visit('/?types=datasets');

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${visibleRowLabel}]`).as(
      'nodeToToggle'
    );

    // Assert
    cy.get('@nodeToToggle').should('be.checked');
  });
});
