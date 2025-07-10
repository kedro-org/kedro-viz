import React, { createRef } from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DrawLayerNames, DrawLayerNamesGroup } from './draw-layer-names';

// Mock d3 to avoid real DOM manipulation in tests
global.d3Lib = require('d3');

describe('DrawLayerNames', () => {
  it('does nothing if no layers or ref', () => {
    const ref = createRef();
    // Should not throw
    render(<DrawLayerNames layers={[]} layerNamesRef={ref} />);
    render(
      <DrawLayerNames
        layers={[{ id: 1, name: 'Layer 1' }]}
        layerNamesRef={null}
      />
    );
  });

  it('renders and updates layer names with D3', () => {
    // Create a fake ul element for D3 to select
    const layerNamesList = document.createElement('ul');
    document.body.appendChild(layerNamesList);
    const ref = { current: layerNamesList };
    const layers = [
      { id: 'layer1', name: 'Layer 1' },
      { id: 'layer2', name: 'Layer 2' },
    ];
    act(() => {
      render(
        <DrawLayerNames
          layers={layers}
          chartSize={{ sidebarWidth: 50 }}
          orientation="vertical"
          layerNamesRef={ref}
        />
      );
    });
    // D3 should have appended li elements
    expect(layerNamesList.querySelectorAll('.pipeline-layer-name').length).toBe(
      2
    );
    expect(
      layerNamesList.querySelector('[data-id="layer-label--Layer 1"]')
    ).toBeInTheDocument();
    expect(
      layerNamesList.querySelector('[data-id="layer-label--Layer 2"]')
    ).toBeInTheDocument();
    document.body.removeChild(layerNamesList);
  });
});

describe('DrawLayerNamesGroup', () => {
  it('renders a <ul> with correct classes and passes props', () => {
    const ref = createRef();
    const layers = [{ id: 'layer1', name: 'Layer 1' }];
    const { container } = render(
      <DrawLayerNamesGroup
        layers={layers}
        chartSize={{ sidebarWidth: 50 }}
        orientation="vertical"
        displayGlobalNavigation={false}
        displaySidebar={false}
        layerNamesRef={ref}
      />
    );
    const layerNamesList = container.querySelector('ul');
    expect(layerNamesList).toHaveClass('pipeline-flowchart__layer-names');
    expect(layerNamesList).toHaveClass(
      'pipeline-flowchart__layer-names--visible'
    );
    expect(layerNamesList).toHaveClass(
      'pipeline-flowchart__layer-names--no-global-toolbar'
    );
    expect(layerNamesList).toHaveClass(
      'pipeline-flowchart__layer-names--no-sidebar'
    );
  });
});
