// All E2E Tests Related to flowchart DAG goes here.
describe('Flowchart DAG', () => {
  before(() => {
    cy.visit('/'); // Visit the application
  });

  beforeEach(() => {
    cy.enablePrettyNames(); // Enable pretty names using the custom command
    cy.wait(500);
    cy.get('.feature-hints__close').click(); // Close the feature hints so can click on a node
    cy.wait(500);
  });

  it('verifies that users can expand a collapsed modular pipeline in the flowchart. #TC-23', () => {
    const modularPipelineText = 'feature_engineering';
    const taskNodeText = 'create_derived_features';

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

  it('verifies that users can open the metadata panel for nodes and see the node details. #TC-24', () => {
    const nodeToClickText = 'Split Data';

    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
    cy.get('.pipeline-metadata__title').should('have.text', nodeToClickText);
    cy.get('[data-label="Type:"] > .pipeline-metadata__value')
      .invoke('text')
      .then((nodeTypeText) =>
        expect(nodeTypeText.toLowerCase()).to.be.eq('node')
      );
    cy.get('[data-label="Inputs:"]').should('exist');
    cy.get('[data-label="Outputs:"]').should('exist');
    cy.get('[data-label="Run Command:"]').should('exist');
  });

  it('verifies that users can open the code block in the metadata panel. #TC-25', () => {
    // Assert before action
    cy.get('.pipeline-metadata-code--visible').should('not.exist');

    // Action
    cy.get('.pipeline-node.pipeline-node--task').first().click();
    cy.get('[data-test*="metadata-code-toggle-"]').check({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata-code--visible').should('exist');
    cy.get('.pipeline-metadata-code__title').should('have.text', 'Code block');
  });

  it('verifies that users can open the metadata panel for parameters and see the parameter details. #TC-26', () => {
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
    cy.get('[data-label="Type:"] > .pipeline-metadata__value')
      .invoke('text')
      .then((nodeTypeText) =>
        expect(nodeTypeText.toLowerCase()).to.be.eq('parameters')
      );
    cy.get('[data-label="File Path:"]').should('exist');
    cy.get('[data-label="Parameters:"]').should('exist');
  });

  it('verifies that users can open the metadata panel for datasets and see the dataset details. #TC-27', () => {
    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.get('.pipeline-node.pipeline-node--data').first().click();

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
    cy.get('[data-label="Type:"] > .pipeline-metadata__value')
      .invoke('text')
      .then((nodeTypeText) =>
        expect(nodeTypeText.toLowerCase()).to.be.eq('dataset')
      );
    cy.get('[data-label="Dataset Type:"]').should('exist');
    cy.get('[data-label="File Path:"]').should('exist');
    cy.get('.preview-table').should('exist');
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

  it('verifies that users can open the metadata panel showing tracking data from last run. #TC-31', () => {
    const nodeToClickText = 'R2 Score';

    // Assert before action
    cy.get('.pipeline-metadata--visible').should('not.exist');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });

    // Assert after action
    cy.get('.pipeline-metadata--visible').should('exist');
    cy.contains('.pipeline-metadata__title', nodeToClickText);
    cy.get(
      '[data-label="Tracking data from last run:"] > .pipeline-json__object'
    ).should('exist');
  });

  it('verifies that users can navigate to experiment tracking by clicking on Open in Experiment Tracking button on the metadata panel. #TC-32', () => {
    const nodeToClickText = 'R2 Score';

    // Assert before action
    cy.location('pathname').should('not.eq', '/experiment-tracking');
    cy.location('search').should('not.eq', '?view=Metrics');

    // Action
    cy.contains('text', nodeToClickText).click({ force: true });
    cy.get('.pipeline-metadata__link').click();

    // Assert after action
    cy.location('pathname').should('eq', '/experiment-tracking');
    cy.location('search').should('eq', '?view=Metrics');
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
      .and('include.text', `Oops, there's nothing to see here`);
  });

  it('verifies that users can open and see the dataset statistics in the metadata panel for datasets. #TC-51', () => {
    const dataNodeText = 'Companies';

    // Assert before action
    cy.get('[data-label="Dataset statistics:]').should('not.exist');

    // Action
    cy.get('.pipeline-node > .pipeline-node__text')
      .contains(dataNodeText)
      .click({ force: true });

    // Assert after action
    cy.get('[data-label="Dataset statistics:"]').should('exist');
    cy.get('[data-test=metadata-stats-value-rows]')
      .invoke('text')
      .should((rowsValue) => expect(rowsValue).to.be.eq('77,096'));
    cy.get('[data-test=metadata-stats-value-columns]')
      .invoke('text')
      .should((colsValue) => expect(parseInt(colsValue)).to.be.eq(5));
    cy.get('[data-test=metadata-stats-value-file_size]')
      .invoke('text')
      .should((fileSizeValue) => expect(fileSizeValue).to.be.eq('1.8MB'));
  });
});
