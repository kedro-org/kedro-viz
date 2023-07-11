describe('Pipeline Primary Toolbar', () => {
  it('verifies that users can hide/show the side menu. #TC-8', () => {
    // Alias
    cy.get('[data-test="btnToggleMenu"]').as('btnToggleMenu');
    cy.get('.pipeline-sidebar--visible').as('pipelineSideBar');

    // Assert before action
    cy.__checkForAriaLabel__('@btnToggleMenu', 'Hide menu');
    cy.get('@pipelineSideBar').should('exist');

    // Action
    cy.get('@btnToggleMenu').click();

    // Assert after action
    cy.__checkForAriaLabel__('@btnToggleMenu', 'Show menu');
    cy.get('@pipelineSideBar').should('not.exist');
  });

  it('verifies that users can hide/show the text labels. #TC-9', () => {
    // Alias
    cy.get('[data-test="btnToggleLabels"]').as('btnToggleLabels');
    cy.get('.pipeline-node__text').as('pipelineNodeLabels');

    // Assert before action
    cy.__checkForAriaLabel__('@btnToggleLabels', 'Hide text labels');
    cy.get('@pipelineNodeLabels').should('have.css', 'opacity').and('eq', '1');

    // Action
    cy.get('@btnToggleLabels').click();

    // Assert after action
    cy.__checkForAriaLabel__('@btnToggleLabels', 'Show text labels');
    cy.get('@pipelineNodeLabels').should('have.css', 'opacity').and('eq', '0');
  });

  it('verifies that users can hide/show layers. #TC-10', () => {
    // Alias
    cy.get('[data-test="btnToggleLayers"]').as('btnToggleLayers');
    cy.get('.pipeline-layer').as('pipelineLayer');

    // Assert before action
    cy.__checkForAriaLabel__('@btnToggleLayers', 'Turn data layers off');
    cy.get('@pipelineLayer').should('exist');

    // Action
    cy.get('@btnToggleLayers').click();

    // Assert after action
    cy.__checkForAriaLabel__('@btnToggleLayers', 'Turn data layers on');
    cy.get('@pipelineLayer').should('not.exist');
  });

  it('verifies that users can access the export pipeline visualisation page. #TC-11', () => {
    // Action
    cy.get('[data-test="btnExportGraph"]').click();

    // Assertions
    cy.get('.modal--visible').then(($dialog) => {
      cy.wrap($dialog).within(() => {
        cy.get('.modal__title').should(
          'have.text',
          'Export pipeline visualisation'
        );
      });

      cy.wrap($dialog).within(() => {
        cy.get('[data-test="btnDownloadPNG"]')
          .should('exist')
          .and('have.text', 'Download PNG');
      });

      cy.wrap($dialog).within(() => {
        cy.get('[data-test="btnDownloadSVG"]')
          .should('exist')
          .and('have.text', 'Download SVG');
      });
    });
  });

  it('verifies that users can download a PNG of their visualisation. #TC-12', () => {
    // Action
    cy.get('[data-test=btnDownloadPNG]').click({ force: true });

    // Assertion
    cy.__validateImage__('kedro-pipeline.png');
  });

  it('verifies that users can download an SVG of their visualisation. #TC-13', () => {
    // Action
    cy.get('[data-test=btnDownloadSVG]').click({ force: true });

    // Assertion
    cy.__validateImage__('kedro-pipeline.svg');
  });
});

describe('Pipeline Minimap Toolbar', () => {
  it('verifies that users can hide/show minimap. #TC-14', () => {
    // Alias
    cy.get('[data-test="btnToggleMinimap"]').as('btnToggleMinimap');
    cy.get('.pipeline-minimap-container').as('minimapContainer');

    // Assert before action
    cy.__checkForAriaLabel__('@btnToggleMinimap', 'Turn minimap off');
    cy.get('@minimapContainer')
      .should('have.attr', 'style')
      .and('include', 'transform');

    // Action
    cy.get('@btnToggleMinimap').click();

    // Assert after action
    cy.__checkForAriaLabel__('@btnToggleMinimap', 'Turn minimap on');
    cy.get('@minimapContainer')
      .should('have.attr', 'style')
      .and('not.include', 'transform');
  });

  it('verifies that users can zoom in/out/reset. #TC-15', () => {
    // Alias
    cy.get('[data-test="btnZoomIn"]').as('btnZoomIn');
    cy.get('[data-test="btnZoomOut"]').as('btnZoomOut');
    cy.get('[data-test="btnResetZoom"]').as('btnResetZoom');
    cy.get('.pipeline-minimap-toolbar__scale').as('zoomScale');

    // Zoom values are calculated once the flowchart is drawn, so we wait for pageLoad to complete
    cy.__waitForPageLoad__(() => {
      let initialZoomValue;
      let zoomInValue;

      cy.get('@zoomScale')
        .invoke('text')
        .then((text) => {
          initialZoomValue = parseFloat(text.replace('%', ''));
        });

      for (let i = 0; i < 3; i++) {
        cy.get('@btnZoomIn').click();
      }

      cy.get('@zoomScale')
        .invoke('text')
        .should((text) => {
          zoomInValue = parseFloat(text.replace('%', ''));
          expect(initialZoomValue).to.be.lt(zoomInValue);
        });

      cy.get('@btnZoomOut').click();

      cy.get('@zoomScale')
        .invoke('text')
        .should((text) => {
          expect(zoomInValue).to.be.gt(parseFloat(text.replace('%', '')));
        });

      cy.get('@btnResetZoom').click();

      cy.get('@zoomScale')
        .invoke('text')
        .should((text) => {
          expect(initialZoomValue).to.be.eq(parseFloat(text.replace('%', '')));
        });
    });
  });
});
