// All E2E Tests Related to global-toolbar goes here.
describe('global toolbar', () => {
  it('verifies that users can access the flowchart page through the flowchart button, when in the experiment tracking view', function () {
    cy.visit('/experiment-tracking');
    cy.get('[data-test="View your pipeline"]').click();
    cy.get('[data-test="View your pipeline"]')
      .parent()
      .parent()
      .should('have.class', 'active');
    cy.location('pathname').should('eq', '/');
    cy.get('[data-test="pipeline-wrapper"]').should('exist');
  });

  it('verifies that users can access the experiment tracking page through the experiment tracking button, when in the flowchart view', function () {
    cy.get('[data-test="View your experiments"]').click();
    cy.get('[data-test="View your experiments"]')
      .parent()
      .parent()
      .should('have.class', 'active');
    cy.location('pathname').should('eq', '/experiment-tracking');
    cy.get('[data-test="pipeline-wrapper"]').should('not.exist');
    // const etClassesToCheck = ['experiment-wrapper', 'experiment-wrapper__error', 'details-mainframe']; // Array of classes to check
    // Assert that at least one class from the array is found in the document
    // cy.matchClassesInDoc(etClassesToCheck).should('exist');
  });

  it('verifies that users can change the theme from light to dark theme, or dark to light theme', function () {
    cy.get('[data-test="Toggle Theme"]').then(($element) => {
      const ariaLabel = $element.attr('aria-label');
      if (ariaLabel && ariaLabel === 'Change to light theme') {
        cy.wrap($element).click();
        cy.wrap($element)
          .should('have.attr', 'aria-label')
          .and('eq', 'Change to dark theme');
      } else {
        cy.wrap($element).click();
        cy.wrap($element)
          .should('have.attr', 'aria-label')
          .and('eq', 'Change to light theme');
      }
    });
  });

  it('verifies that users can access the settings panel with the settings button', function () {
    cy.get('[data-test="Change the settings flags"]').click();
    cy.get('[role="dialog"]')
      .should('be.visible')
      .then(($dialog) => {
        cy.wrap($dialog)
          .find('[data-test="Cancel Button in Settings Modal"]')
          .click();
      });
    cy.get('[role="dialog"]').should('be.not.visible');
  });
});

//   cy.get('[data-test="Toggle Theme"]').click();
//   cy.get('[data-test="Toggle Theme"]').click();
//   cy.get('[data-test="Change the settings flags"]').click();
//   cy.get('[role="dialog"]').should('be.visible').then(($dialog)=>{
//     cy.wrap($dialog).find('[data-test="Cancel Button in Settings Modal"]').click()
//   });
//   cy.get('[role="dialog"]').should('be.not.visible');

//   // Hover/UnHover Tests

//   // Hover View your pipeline
//   cy.hover('[data-test="View your pipeline"]');
//   cy.get('[data-test="View your pipeline"]').within(() => {
//     return cy.get('span').should('have.class', 'pipeline-toolbar__label__visible')
//   })
//   // UnHover View your pipeline
//   cy.unhover('[data-test="View your pipeline"]');
//   cy.get('[data-test="View your pipeline"]').within(() => {
//     return cy.get('span').should('not.have.class', 'pipeline-toolbar__label__visible')
//   })

//   // Hover View your experiments
//   cy.hover('[data-test="View your experiments"]');
//   cy.get('[data-test="View your experiments"]').within(() => {
//     return cy.get('span').should('have.class', 'pipeline-toolbar__label__visible')
//   })
//   // UnHover View your experiments
//   cy.unhover('[data-test="View your experiments"]');
//   cy.get('[data-test="View your experiments"]').within(() => {
//     return cy.get('span').should('not.have.class', 'pipeline-toolbar__label__visible')
//   })

//   // Hover Toggle Theme
//   cy.hover('[data-test="Toggle Theme"]');
//   cy.get('[data-test="Toggle Theme"]').within(() => {
//     return cy.get('span').should('have.class', 'pipeline-toolbar__label__visible')
//   })
//   // UnHover Toggle Theme
//   cy.unhover('[data-test="Toggle Theme"]');
//   cy.get('[data-test="Toggle Theme"]').within(() => {
//     return cy.get('span').should('not.have.class', 'pipeline-toolbar__label__visible')
//   })

//   // Hover Change the settings flags
//   cy.hover('[data-test="Change the settings flags"]');
//   cy.get('[data-test="Change the settings flags"]').within(() => {
//     return cy.get('span').should('have.class', 'pipeline-toolbar__label__visible')
//   })
//   // UnHover Change the settings flags
//   cy.unhover('[data-test="Change the settings flags"]');
//   cy.get('[data-test="Change the settings flags"]').within(() => {
//     return cy.get('span').should('not.have.class', 'pipeline-toolbar__label__visible')
//   })
