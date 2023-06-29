describe('Pipeline Primary Toolbar', () => {
  it('verifies that users can hide/show the side menu', () => {
    cy.get('[data-test="btnToggleMenu"]')
      .should('have.attr', 'aria-label')
      .and('eq', 'Hide menu');
    cy.get('.pipeline-sidebar--visible').should('exist');

    cy.get('[data-test="btnToggleMenu"]').click();

    cy.get('[data-test="btnToggleMenu"]')
      .should('have.attr', 'aria-label')
      .and('eq', 'Show menu');
    cy.get('.pipeline-sidebar--visible').should('not.exist');
  });

  it('verifies that users can hide/show the text labels', () => {
    cy.get('[data-test="btnToggleLabels"]')
      .should('have.attr', 'aria-label')
      .and('eq', 'Hide text labels');
    cy.get('.pipeline-node__text').should('have.css', 'opacity').and('eq', '1');

    cy.get('[data-test="btnToggleLabels"]').click();

    cy.get('[data-test="btnToggleLabels"]')
      .should('have.attr', 'aria-label')
      .and('eq', 'Show text labels');
    cy.get('.pipeline-node__text').should('have.css', 'opacity').and('eq', '0');
  });

  it('verifies that users can hide/show layers', () => {
    cy.get('[data-test="btnToggleLayers"]')
      .should('have.attr', 'aria-label')
      .and('eq', 'Turn data layers off');
    cy.get('.pipeline-layer').should('exist');

    cy.get('[data-test="btnToggleLayers"]').click();

    cy.get('[data-test="btnToggleLayers"]')
      .should('have.attr', 'aria-label')
      .and('eq', 'Turn data layers on');
    cy.get('.pipeline-layer').should('not.exist');
  });

  it.only('verifies that users can access the export pipeline visualisation page', () => {
    cy.get('[data-test="btnExportGraph"]').click();
    cy.get('.modal > [role="dialog"]')
      .should('be.visible')
      .then(($dialog) => {
        cy.wrap($dialog)
          .should('have.attr', 'class')
          .and('contains', 'modal--visible');

        cy.wrap($dialog).within(() => {
          cy.get('.modal__title')
            .should('have.class', 'modal__title')
            .should('have.text', 'Export pipeline visualisation');
        });

        cy.wrap($dialog).within(() => {
          cy.get('[data-test="btnDownloadPNG]')
            .should('exist')
            .and('have.text', 'Download PNG');
        });

        cy.wrap($dialog).within(() => {
          cy.get('[data-test="btnDownloadSVG]')
            .should('exist')
            .and('have.text', 'Download SVG');
        });
      });
  });

  it('verifies that users can download a PNG of their visualisation', () => {
    cy.get('[data-test=btnDownloadPNG]').click();
  });

  it('verifies that users can download an SVG of their visualisation', () => {
    cy.get('[data-test=btnDownloadSVG]').click();
  });
});
describe('Pipeline Minimap Toolbar', () => {});
