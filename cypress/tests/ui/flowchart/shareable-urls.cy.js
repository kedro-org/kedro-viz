describe('Shareable URLs', () => {
  it('verifies that users can open the Deploy Kedro-Viz modal. #TC-52', () => {
    // Intercept the network request to mock with a fixture
    cy.__interceptRest__(
      '/api/package-compatibilities',
      'GET',
      '/mock/package-compatibilities-compatible.json'
    );

    // Action
    cy.reload();
    cy.get('.pipeline-menu-button--deploy').click({ force: true });

    // Assert after action
    cy.get('.shareable-url-modal .modal__wrapper').contains(
      `Publish and Share Kedro-Viz`
    );
  });

  it("shows an incompatible message given the user's fsspec package version is outdated. #TC-53", () => {
    // Intercept the network request to mock with a fixture
    cy.__interceptRest__(
      '/api/package-compatibilities',
      'GET',
      '/mock/package-compatibilities-incompatible.json'
    );

    // Action
    cy.reload();
    cy.get('.pipeline-menu-button--deploy').click({ force: true });

    // Assert after action
    cy.get('.shareable-url-modal .modal__wrapper').contains(
      `Publishing Kedro-Viz is only supported with fsspec>=2023.9.0. You are currently on version 2023.8.1.`
    );
  });

  it('verifies that shareable url modal closes on close button click #TC-54', () => {
    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains('Cancel')
      .click();

    // Assert after action
    cy.get('.modal.shareable-url-modal').should(
      'not.have.class',
      'modal--visible'
    );
  });
});
