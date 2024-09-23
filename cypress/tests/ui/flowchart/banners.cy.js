describe('Banners in Kedro-Viz', () => {
  beforeEach(() => {
    // Clears localStorage before each test
    cy.clearLocalStorage();
  });

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
    cy.get('.banner-message-body').should('contains.text', 'please install the missing Kedro project dependencies')
    cy.get('.banner-message-title').should('contains.text', 'Missing dependencies')

    // Test Learn more link
    cy.get(".banner a")
      .should("contains.attr", "href", "https://docs.kedro.org/projects/kedro-viz/en/latest/kedro-viz_visualisation.html#visualise-a-kedro-project-without-installing-project-dependencies");

    // Close the banner
    cy.get(".banner-close").click()
    cy.get('[data-test="flowchart-wrapper--lite-banner"]').should('not.exist');

  });
});
