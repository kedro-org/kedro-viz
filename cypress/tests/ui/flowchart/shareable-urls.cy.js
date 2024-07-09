describe('Shareable URLs with empty localStorage', () => {
  beforeEach(() => {
    // Clears localStorage before each test
    cy.clearLocalStorage();
  });

  it('verifies that users can open the Deploy Kedro-Viz modal if the localStorage is empty. #TC-52', () => {
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

  it('verifies that users can click on platform dropdown and see all platform options #TC-55', () => {
    const platformCount = 3;

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();

    // Assert after action
    cy.get('.shareable-url-modal .menu-option').should(
      'have.length',
      platformCount
    );
  });

  it('verifies that publish button should be disabled when platform is not selected and bucket name & endpoint name are empty #TC-56', () => {
    const selectedPlatform = 'Select a hosting platform';
    const primaryButtonNodeText = 'Publish';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();

    // Assert after action
    cy.get(
      '.shareable-url-modal [data-test=kedro-pipeline-selector] .dropdown__label span'
    ).contains(selectedPlatform);
    cy.get(
      '.shareable-url-modal .shareable-url-modal__input-wrapper input'
    ).should('have.value', '');
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .should('be.disabled');
  });

  it('verifies that publish button should be disabled when a platform is selected and bucket name is empty #TC-57', () => {
    const primaryButtonNodeText = 'Publish';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();

    // Assert after action
    cy.get(
      '.shareable-url-modal .shareable-url-modal__input-wrapper input'
    ).should('have.value', '');
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .should('be.disabled');
  });

  it('verifies that publish button should be enabled when platform is selected and bucket name & endpoint name are not empty #TC-58', () => {
    const endpointName = 'http://www.example.com';
    const bucketName = 'myBucketName';
    const primaryButtonNodeText = 'Publish';

    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();
    cy.get('.shareable-url-modal [data-test="bucket_name"]').type(bucketName);
    cy.get('.shareable-url-modal [data-test="endpoint_name"]').type(
      endpointName
    );

    // Assert after action
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .should('be.enabled');
  });

  it('verifies that error message appears with wrong inputs on publish button click #TC-59', () => {
    const endpointName = 'http://www.example.com';
    const bucketName = 'myBucketName';
    const primaryButtonNodeText = 'Publish';
    // Action
    cy.get('.pipeline-menu-button--deploy').click();
    cy.get('.shareable-url-modal [data-test=kedro-pipeline-selector]').click();
    cy.get('.shareable-url-modal .dropdown__options section div')
      .first()
      .click();
    cy.get('.shareable-url-modal [data-test="bucket_name"]').type(bucketName);
    cy.get('.shareable-url-modal [data-test="endpoint_name"]').type(
      endpointName
    );
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();

    // Assert after action
    cy.get('.shareable-url-modal .modal__wrapper').contains(
      'Something went wrong. Please try again later.'
    );
  });

  it('verifies that AWS link is generated with correct inputs on publish button click #TC-60', () => {
    const bucketName = 'myBucketName';
    const endpointName = 'http://www.example.com';
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
    cy.get('.shareable-url-modal [data-test="bucket_name"]').type(bucketName);
    cy.get('.shareable-url-modal [data-test="endpoint_name"]').type(
      endpointName
    );
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();

    // Wait for the POST request to complete and check the mocked response
    cy.wait('@publishRequest').then((interception) => {
      // Assert after action
      cy.get('.url-box__result-url').contains(interception.response.body.url);
    });
  });

  it('verifies that AWS link is generated with correct inputs on Republish button click #TC-61', () => {
    const bucketName = 'myBucketName';
    const endpointName = 'http://www.example.com';
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
    cy.get('.shareable-url-modal [data-test="bucket_name"]').type(bucketName);
    cy.get('.shareable-url-modal [data-test="endpoint_name"]').type(
      endpointName
    );
    cy.get('.shareable-url-modal__button-wrapper button')
      .contains(primaryButtonNodeText)
      .click();

    // Wait for the POST request to complete and check the mocked response
    cy.wait('@publishRequest').then((interception) => {
      // Assert after action
      cy.get('.url-box__result-url').contains(interception.response.body.url);
    });
  });
});

describe('Shareable URLs with valid localStorage', () => {
  const bucketName = 'myBucketName';
  const endpointName = 'http://www.example.com';
  const secondBucketName = 'mySecondBucketName';
  const secondEndpointName = 'http://www.exampleNumber2.com';

  it('verifies that users can open the Published Content Kedro-Viz modal with valid URL after published it succesfully. #TC-XX', () => {
    cy.__setupAndSubmitShareableUrlForm__(bucketName, endpointName, 'Publish');

    // Wait for the POST request to complete
    cy.wait('@publishRequest').then(() => {
      // Close the modal once it publishes succesfully
      cy.get('body').click(0, 0);

      // Open the deploy modal again
      cy.get('.pipeline-menu-button--deploy').click();
      cy.get('.shareable-url-modal .modal__wrapper').contains(
        `Publish and Share Kedro-Viz`
      );
      cy.get('.url-box__result-url').contains(endpointName);
    });
  });

  it('verifies that after published to more than one platform, users can open the Published Content Kedro-Viz modal to select on different option. #TC-XX1', () => {
    const fillFormAndSubmit = (bucketName, endpointName) => {
      cy.get('.shareable-url-modal [data-test="bucket_name"]').clear();
      cy.get('.shareable-url-modal [data-test="bucket_name"]').type(bucketName);
      cy.get('.shareable-url-modal [data-test="endpoint_name"]').clear();
      cy.get('.shareable-url-modal [data-test="endpoint_name"]').type(
        endpointName
      );
      cy.get('.shareable-url-modal__button-wrapper button')
        .contains('Publish')
        .click();
    };

    const selectHostingPlatform = (index) => {
      cy.get(
        '.shareable-url-modal [data-test=kedro-pipeline-selector]'
      ).click();
      cy.get('.shareable-url-modal .dropdown__options section div')
        .eq(index)
        .click();
    };

    cy.__setupAndSubmitShareableUrlForm__(bucketName, endpointName, 'Publish');

    // Wait for the POST request to complete
    cy.wait('@publishRequest').then(() => {
      // Close the modal once it publishes successfully
      cy.get('body').click(0, 0);
      // Open the deploy modal again
      cy.get('.pipeline-menu-button--deploy').click();
      cy.get('.shareable-url-modal__published-action button').click();

      // Select the second hosting platform from the dropdown
      selectHostingPlatform(2);

      // Fill in the form with second option
      fillFormAndSubmit(secondBucketName, secondEndpointName);

      // Close the modal once it publishes successfully
      cy.get('body').click(0, 0);

      cy.get('.pipeline-menu-button--deploy').click();

      cy.get(
        '.shareable-url-modal__published-dropdown-wrapper [data-test=kedro-pipeline-selector]'
      ).click();

      cy.get(
        '.shareable-url-modal__published-dropdown-wrapper .dropdown__options section div'
      )
        .eq(1)
        .click();

      cy.get('.url-box__result-url').contains(secondEndpointName);
    });
  });
});
