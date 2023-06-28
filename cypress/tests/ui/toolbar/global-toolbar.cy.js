// All E2E Tests Related to global-toolbar goes here.

describe('Global Toolbar', () => {
  // Shared variables
  const flowChartClassNames = [
    'pipeline-wrapper',
    'pipeline-nodelist__elements-panel',
    'pipeline-nodelist__filter-panel',
    'pipeline-minimap',
    'pipeline-minimap__graph',
    'pipeline-minimap__viewport',
    'pipeline-flowchart__graph',
  ];
  const experimentTrackingClassNames = [
    'runs-list__wrapper',
    'runs-list-card',
    'details-mainframe',
    'details__tabs',
    'tabs__item',
    'details-metadata',
    'details-dataset',
  ];

  it('verifies that users can access the flowchart page through the flowchart icon, when in the experiment tracking view', function () {
    cy.visit('/experiment-tracking');
    cy.get('[data-test="View your pipeline"]').click();
    cy.get('[data-test="View your pipeline"]')
      .parent()
      .parent()
      .should('have.class', 'active');
    cy.location('pathname').should('eq', '/');

    // should exist
    cy.get('[data-test="kedro-pipeline-selector"]').should('exist');
    cy.get('[role="search"]').should('exist');

    cy.checkClassExistence(flowChartClassNames, 'exist'); // custom command

    // should not exist
    cy.checkClassExistence(experimentTrackingClassNames, 'not.exist'); // custom command
  });

  it('verifies that users can access the experiment tracking page through the experiment tracking button, when in the flowchart view', function () {
    cy.get('[data-test="View your experiments"]').click();
    cy.get('[data-test="View your experiments"]')
      .parent()
      .parent()
      .should('have.class', 'active');
    cy.location('pathname').should('eq', '/experiment-tracking');

    // should exist
    cy.get('[role="search"]').should('exist');
    cy.checkClassExistence(experimentTrackingClassNames, 'exist'); // custom command

    // should not exist
    cy.get('[data-test="kedro-pipeline-selector"]').should('not.exist');
    cy.checkClassExistence(flowChartClassNames, 'not.exist'); // custom command
  });

  it('verifies that users can change the theme from light to dark theme, or dark to light theme', function () {
    cy.get('[data-test="Toggle Theme"]').then(($element) => {
      cy.get('.kui-theme--dark').should('exist');
      cy.get('.kui-theme--light').should('not.exist');
      cy.wrap($element)
        .should('have.attr', 'aria-label')
        .and('eq', 'Change to light theme');

      cy.wrap($element).click();

      cy.get('.kui-theme--light').should('exist');
      cy.get('.kui-theme--dark').should('not.exist');
      cy.wrap($element)
        .should('have.attr', 'aria-label')
        .and('eq', 'Change to dark theme');

      cy.wrap($element).click();
    });
  });

  it('verifies that users can access the settings panel with the settings button', function () {
    cy.get('[data-test="Change the settings flags"]').click();
    cy.get('.pipeline-settings-modal > [role="dialog"]')
      .should('be.visible')
      .then(($dialog) => {
        cy.wrap($dialog)
          .should('have.attr', 'class')
          .and('contains', 'modal--visible');

        cy.wrap($dialog).within(() => {
          cy.get('.modal__title')
            .should('have.class', 'modal__title')
            .should('have.text', 'Settings');
        });

        cy.wrap($dialog)
          .find('[data-test="Cancel Button in Settings Modal"]')
          .click();
      })
      
      cy.get('.pipeline-settings-modal > [role="dialog"]', { timeout: 5000 }).should('be.not.visible');
    
    
  });

  describe.only('Settings Panel', () => {
    it('verifies that users can change the display of the names of their kedro nodes', function () {
      cy.get('[data-test="Change the settings flags"]').click();
      cy.get('.pipeline-settings-modal > [role="dialog"]')
        .should('be.visible')
        .then(() => {
         
          cy.get('[data-test="pipeline-toggle-input-isPrettyName"]').as('isPrettyNameCheckbox')
        
          // Assert that the checkbox is checked
          cy.get('@isPrettyNameCheckbox').should('be.checked');

          // Uncheck the checkbox and click on apply changes
          cy.get('@isPrettyNameCheckbox').uncheck({force: true})
          cy.get('[data-test="Apply changes and close in Settings Modal"]').click();
        })

        cy.get('.pipeline-settings-modal > [role="dialog"]', { timeout: 5000 }).should('be.not.visible');
        
        // Wait for pipeline node list to appear, due to a reload
      
        // The pipeline names should show original names
        cy.get('.pipeline-nodelist__row__label').then(($elements) => {
            
          // Convert Cypress collection to an array
          // const elementsArray = $elements.toArray();
           
          // Filter elements that have a title matching the regex pattern
          // const filteredElements = elementsArray.filter(($element) => {
          //     const title = $element.getAttribute('title');
          //     cy.log(title)
          //     return title && title.match(/[_\-:]/);
          // });
          // Check if any filtered elements exist
          // expect(filteredElements.length).to.be.greaterThan(0);
        })
        // The node names should show original names
    
    });
  })

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
