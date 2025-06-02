import React, { createRef } from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as d3 from 'd3';
import { DrawLayers, DrawLayersGroup } from './draw-layers';

d3.selection.prototype.transition = function () {
    return this;
};
d3.selection.prototype.duration = function () {
    return this;
};
d3.selection.prototype.style = function () {
    return this;
};
d3.selection.prototype.remove = function () {
    return this;
};
d3.selection.prototype.merge = function () {
    return this;
};
d3.selection.prototype.filter = function () {
    return this;
};
d3.selection.prototype.onEvent = function () {
    return this;
};
d3.selection.prototype.append = function () {
    return this;
};
d3.selection.prototype.attr = function () {
    return this;
};
d3.selection.prototype.selectAll = d3.selection.prototype.selectAll || function () {
    return this;
};
d3.selection.prototype.data = d3.selection.prototype.data || function () {
    return this;
};

describe('DrawLayers', () => {
  afterEach(cleanup);

  const baseLayer = {
    id: 'layer-1',
    x: 10,
    y: 20,
    width: 100,
    height: 30,
  };

  it('does nothing if no layers or ref', () => {
    const ref = createRef();
    // Should not throw
    render(<DrawLayers layers={[]} layersRef={ref} />);
    render(<DrawLayers layers={[baseLayer]} layersRef={null} />);
  });

  it('renders and updates layer rects with D3', async () => {
    // Create a fake SVG element for D3 to select
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);
    const ref = { current: svg };
    const layers = [
      { ...baseLayer, id: 'layer-1', x: 10, y: 20, width: 100, height: 30 },
      { ...baseLayer, id: 'layer-2', x: 50, y: 60, width: 80, height: 40 },
    ];
    render(
      <DrawLayers
        layers={layers}
        layersRef={ref}
      />
    );
    // D3 should have appended rect elements
    await waitFor(() => {
      expect(svg.querySelectorAll('.pipeline-layer').length).toBe(2);
    });
    document.body.removeChild(svg);
  });
});

describe('DrawLayersGroup', () => {
  it('renders a <g> with correct class and passes props', () => {
    const ref = createRef();
    const layers = [{ id: 'layer-1', x: 0, y: 0, width: 10, height: 10 }];
    const { container } = render(
      <svg>
        <DrawLayersGroup
          layers={layers}
          layersRef={ref}
          onLayerMouseOver={() => {}}
          onLayerMouseOut={() => {}}
        />
      </svg>
    );
    const group = container.querySelector('g.pipeline-flowchart__layers');
    expect(group).toBeInTheDocument();
  });
});
