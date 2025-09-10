import React, { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DrawLayers, DrawLayersGroup } from './draw-layers';

describe('DrawLayers', () => {
  afterEach(cleanup);

  const baseLayer = {
    id: 'layer-1',
    x: 10,
    y: 20,
    width: 100,
    height: 30,
  };

  it('renders without crashing if no layers or ref', () => {
    const ref = createRef();
    render(<DrawLayers layers={[]} layersRef={ref} />);
    render(<DrawLayers layers={[baseLayer]} layersRef={null} />);
  });

  it('renders the layers group if used in a group', () => {
    const ref = createRef();
    const layers = [baseLayer];
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
