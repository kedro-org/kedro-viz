// All E2E Tests Related to flowchart goes here.
describe('Flowchart', () => {
  it('verifies that users can expand a collapsed modular pipeline in the flowchart. #TC-23', () => {
    const modularPipelineText = 'feature_engineering';
    const taskNodeText = 'Create Derived Features';

    // Assert before action
    cy.get('.pipeline-node > .pipeline-node__text').should(
      'not.contain',
      taskNodeText
    );

    // Action
    cy.get(`.pipeline-node[data-id=${modularPipelineText}]`).click();

    // Assert after action
    cy.get('.pipeline-node > .pipeline-node__text').should(
      'contain',
      taskNodeText
    );
  });

  it('verifies that users can open the metadata panel for nodes. #TC-24', () => {
    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.get('.pipeline-node.pipeline-node--task').first().click();

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
  });

  it('verifies that users can open the code block in the metadata panel. #TC-25', () => {
    // Assert before action
    cy.get('.pipeline-metadata-code--visible').should('not.exist');

    // Action
    cy.get('.pipeline-node.pipeline-node--task').first().click();
    cy.get('[data-test="pipeline-toggle-input-code"]').check({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata-code--visible').should('exist');
    cy.get('.pipeline-metadata-code__title').should('have.text', 'Code block');
  });

  it('verifies that users can open the metadata panel for parameters. #TC-26', () => {
    const nodeToToggleText = 'Parameters';

    // Alias
    cy.get(`.pipeline-nodelist__row__checkbox[name=${nodeToToggleText}]`).as(
      'nodeToToggle'
    );

    // Assert before action
    cy.get('@nodeToToggle').should('not.be.checked');
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.get('@nodeToToggle').check({ force: true });
    cy.get('.pipeline-node--parameters').first().click({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
  });

  it('verifies that users can open the metadata panel for datasets. #TC-27', () => {
    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.get('.pipeline-node.pipeline-node--data').first().click();

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
  });

  it('verifies that users can open and preview the dataset table in the metadata panel for datasets. #TC-28', () => {
    // Assert before action
    cy.get('.pipeline-metadata-modal').should('not.exist');

    // Action
    cy.get('.pipeline-node.pipeline-node--data').first().click();
    cy.get('.pipeline-metadata__link').click();

    // Assert after action
    cy.get('.pipeline-metadata-modal').should('exist');
    cy.get('.pipeline-metadata-modal__preview').should('exist');
    cy.get('.preview-table').should('exist');
  });

  it('verifies that users can open the metadata panel showing the Plotly/Matplotlib preview. #TC-29', () => {
    const nodeToClickText = 'Price Histogram';

    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');
    cy.get('.plot-container.plotly').should('not.exist');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
    cy.get('.plot-container.plotly').should('exist');
  });

  it('verifies that users can open and preview the Plotly/Matplotlib charts in the metadata panel. #TC-30', () => {
    const nodeToClickText = 'Price Histogram';

    // Assert before action
    cy.get('.pipeline-metadata-modal').should('not.exist');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });
    cy.get('.pipeline-metadata__link').click();

    // Assert after action
    cy.get('.pipeline-metadata-modal').should('exist');
    cy.get('.pipeline-plotly-chart.pipeline-plotly__modal').should('exist');
  });

  it('verifies that users can open the metadata panel showing the R2 score details. #TC-31', () => {
    const nodeToClickText = 'R2 Score';

    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
    cy.contains('.pipeline-metadata__title', nodeToClickText);
  });

  it('verifies that users can open and see the R2 score trend. #TC-32', () => {
    const nodeToClickText = 'R2 Score';

    // Assert before action
    cy.location('pathname').should('not.eq', '/experiment-tracking');
    cy.location('search').should('not.eq', '?viewMetrics');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });
    cy.get('.pipeline-metadata__link').click();

    // Assert after action
    cy.location('pathname').should('eq', '/experiment-tracking');
    cy.location('search').should('eq', '?viewMetrics');
    cy.get('.details-mainframe').should('exist');
    cy.get('.details__tabs').should('exist');
  });

  it('verifies that users see an error message when there are no nodes/pipelines. #TC-33', () => {
    // Intercept the network request to mock with a fixture
    cy.__interceptRest__('/api/main', 'GET', '/mock/emptyDataset.json');

    // Action
    cy.reload();

    // Assert after action
    cy.get('.pipeline-warning__title')
      .should('exist')
      .and('have.text', `Oops, there's nothing to see here`);
  });
});
