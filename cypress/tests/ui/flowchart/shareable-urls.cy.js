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

  it('verifies that users can click on region dropdown and see all region options #TC-55', () => {
    const regionCount = 30;

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();

    // Assert after action
    cy.get('.shareable-url-modal .menu-option').should(
      'have.length',
      regionCount
    );
  });

  it('verifies that publish button should be disabled when region is not selected and bucket name is empty #TC-56', () => {
    const selectedRegion = 'Select a region';
    const primaryButtonNodeText = 'Publish';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();

    // Assert after action
    cy.get(
      '.shareable-url-modal [data-test=kedro-pipeline-selector] .dropdown__label span'
    ).contains(selectedRegion);
    cy.get('.shareable-url-modal textarea').should('have.value', '');
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .should('be.disabled');
  });

  it('verifies that publish button should be disabled when a bucket region is selected and bucket name is empty #TC-57', () => {
    const primaryButtonNodeText = 'Publish';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();

    // Assert after action
    cy.get('.shareable-url-modal textarea').should('have.value', '');
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .should('be.disabled');
  });

  it('verifies that publish button should be enabled when region is selected and bucket name is not empty #TC-58', () => {
    const bucketName = 'myBucketName';
    const primaryButtonNodeText = 'Publish';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();
    cy.get('.shareable-url-modal textarea').type(bucketName);

    // Assert after action
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .should('be.enabled');
  });

  it('verifies that error message appears with wrong inputs on publish button click #TC-59', () => {
    const bucketName = 'myBucketName';
    const primaryButtonNodeText = 'Publish';
    const errorButtonNodeText = 'Go back';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();
    cy.get('.shareable-url-modal textarea').type(bucketName);
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();

    // Assert after action
    cy.get('.shareable-url-modal .modal__wrapper').contains(
      'Something went wrong. Please try again later.'
    );
    cy.get('.shareable-url-modal__error button').contains(errorButtonNodeText);
  });

  it('verifies that AWS link is generated with correct inputs on publish button click #TC-60', () => {
    const bucketName = 'myBucketName';
    const primaryButtonNodeText = 'Publish';

    // Intercept the network request to mock with a fixture
    cy.__interceptRest__(
      '/api/deploy',
      'POST',
      '/mock/deploySuccessResponse.json'
    ).as('publishRequest');

    // Action
    cy.reload();
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();
    cy.get('.shareable-url-modal textarea').type(bucketName);
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();

    // Wait for the POST request to complete and check the mocked response
    cy.wait('@publishRequest').then((interception) => {
      // Assert after action
      cy.get('.shareable-url-modal__result-url').contains(
        interception.response.body.url
      );
    });
  });

  it('verifies that AWS link is generated with correct inputs on Republish button click #TC-61', () => {
    const bucketName = 'myBucketName';
    const primaryButtonNodeText = 'Publish';
    const primaryButtonNodeTextVariant = 'Republish';
    const secondaryButtonNodeText = 'Link Settings';

    // Intercept the network request to mock with a fixture
    cy.__interceptRest__(
      '/api/deploy',
      'POST',
      '/mock/deploySuccessResponse.json'
    ).as('publishRequest');

    // Action
    cy.reload();
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();
    cy.get('.shareable-url-modal textarea').type(bucketName);
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();

    // Wait for the POST request to complete
    cy.wait('@publishRequest');

    // Action
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(secondaryButtonNodeText)
      .click();
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeTextVariant)
      .click();

    // Wait for the POST request to complete and check the mocked response
    cy.wait('@publishRequest').then((interception) => {
      // Assert after action
      cy.get('.shareable-url-modal__result-url').contains(
        interception.response.body.url
      );
    });
  });
});
