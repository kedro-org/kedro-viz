// All E2E Tests Related to menu goes here.

describe('Menu', () => {
  it('verifies that users can select a section of the flowchart, through the drop down. #TC-16', function () {
    // Flaky test

    // Alias
    cy.intercept('GET', '/api/pipelines/*').as('pipelineRequest');

    // Action
    cy.get('[data-test="kedro-pipeline-selector"]').click();
    cy.get(':nth-child(2) > .menu-option__content > span').click({
      force: true,
    });

    // Adding an extra wait time due to flakiness
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);

    // Assert after action
    cy.wait('@pipelineRequest').then((interception) => {
      // Get the URL of the intercepted request
      const requestUrl = interception.request.url;
      cy.get(':nth-child(2) > .menu-option__content > span')
        .invoke('text')
        .then((textValue) => {
          cy.url().then((url) => {
            const decodedURI = decodeURIComponent(url);
            const queryParamValue = decodedURI.split('?')[1].split('=')[1];

            expect(queryParamValue.toLowerCase()).to.be.eq(
              textValue.toLowerCase()
            );

            expect(decodeURIComponent(requestUrl).toLowerCase()).to.include(
              `/api/pipelines/${textValue.toLowerCase()}`
            );
            cy.get('.pipeline-nodelist__row__label')
              .first()
              .invoke('text')
              .then((pipelineLabel) => {
                expect(textValue.toLowerCase()).to.include(
                  pipelineLabel.toLowerCase()
                );
              });
          });
        });
    });
  });

//   it('verifies that users can search/filter for a flowchart component using the search box. #TC-17', function () {});
//   it('verifies that users can select a node/dataset/parameters from the menu. #TC-18', function () {});
//   it('verifies that users can highlight a node/dataset/parameters from the menu by hovering on their name. #TC-19', function () {});
//   it('verifies that users can hide/show a node/dataset/parameters in the flowchart, by clicking on the eye icon. #TC-20', function () {});
//   it('verifies that users can select and only show a node/dataset/parameters in the flowchart, by clicking on the box icon. #TC-21', function () {});
//   it('verifies that users can filter/hide an element type. #TC-22', function () {});
});
