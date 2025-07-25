describe('Banners in Kedro-Viz', () => {

  it("shows a missing dependencies banner in viz lite mode if the kedro project dependencies are not installed.", () => {
    // Intercept the network request to mock with a fixture
    cy.__interceptRest__(
      '/api/metadata',
      'GET',
      '/mock/inCompatibleMetadata.json'
    ).as("appMetadata");

    // Action
    cy.reload();

    // Assert after action
    cy.get('[data-test="flowchart-wrapper--lite-banner"]').should('exist');
    cy.get('.banner-message-body').should('contains.text', 'Some features might be disabled in --lite mode due to missing dependencies')
    cy.get('.banner-message-title').should('contains.text', 'Lite mode enabled')

    // Test Learn more link
    cy.get(".banner a")
      .should("contains.attr", "href", "https://docs.kedro.org/projects/kedro-viz/en/stable/kedro-viz_visualisation/#visualise-a-kedro-project-without-installing-project-dependencies");

    // Close the banner
    cy.get(".banner-close").click()
    cy.get('[data-test="flowchart-wrapper--lite-banner"]').should('not.exist');

  });
});
