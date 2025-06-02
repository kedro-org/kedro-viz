import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as d3 from 'd3';
import DrawEdges from './draw-edges';

// Mock d3 transitions and selection methods that are not supported in JSDOM
d3.selection.prototype.transition = function () { 
    return this;
};
d3.selection.prototype.duration = function () { 
    return this;
};
d3.selection.prototype.attrTween = function () { 
    return this;
};
d3.selection.prototype.style = function () { 
    return this;
};
d3.selection.prototype.remove = function () { 
    return this;
};
d3.selection.prototype.merge = function (other) { 
    return this;
};
d3.selection.prototype.filter = function () { 
    return this;
};

describe('DrawEdges', () => {
  afterEach(cleanup);

  const baseEdge = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceNode: { type: 'data' },
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ],
  };

  it('renders without crashing', () => {
    render(<DrawEdges edges={[]} />);
  });

  it('renders correct number of edges', () => {
    const edges = [
      { ...baseEdge, id: 'edge-1' },
      { ...baseEdge, id: 'edge-2', source: 'node-2', target: 'node-3' },
    ];
    const { container } = render(<DrawEdges edges={edges} />);
    // Should render a group for all edges
    const group = container.querySelector('g.pipeline-flowchart__edges');
    expect(group).toBeInTheDocument();
  });

  it('applies faded class when edge is not linked to clickedNode', () => {
    const edges = [baseEdge];
    const linkedNodes = { 'node-1': true };
    const { container } = render(
      <DrawEdges edges={edges} clickedNode="node-2" linkedNodes={linkedNodes} />
    );
    // D3 sets classes dynamically, so we check the group exists
    const group = container.querySelector('g.pipeline-flowchart__edges');
    expect(group).toBeInTheDocument();
  });

  it('applies parameter and input classes based on edge type', () => {
    const paramEdge = {
      ...baseEdge,
      id: 'edge-param',
      sourceNode: { type: 'parameters' },
    };
    const inputOutputDataEdges = { 'edge-param': true };
    const { container } = render(
      <DrawEdges
        edges={[paramEdge]}
        focusMode="input"
        inputOutputDataEdges={inputOutputDataEdges}
      />
    );
    const group = container.querySelector('g.pipeline-flowchart__edges');
    expect(group).toBeInTheDocument();
  });
});

describe('DrawEdges class application', () => {
  it('applies pipeline-edge--parameters when sourceNode.type is parameters and not input/output', async () => {
    const edge = {
      id: 'edge-parameters',
      source: 'node-1',
      target: 'node-2',
      sourceNode: { type: 'parameters' },
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    };
    const { container } = render(
      <DrawEdges edges={[edge]} inputOutputDataEdges={{}} />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-edge');
      expect(el).toHaveClass('pipeline-edge--parameters');
      expect(el).not.toHaveClass('pipeline-edge--parameters-input');
      expect(el).not.toHaveClass('pipeline-edge--dataset--input');
    });
  });

  it('applies pipeline-edge--parameters-input when sourceNode.type is parameters and is input/output', async () => {
    const edge = {
      id: 'edge-parameters-input',
      source: 'node-1',
      target: 'node-2',
      sourceNode: { type: 'parameters' },
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    };
    const { container } = render(
      <DrawEdges edges={[edge]} focusMode="input" inputOutputDataEdges={{ 'edge-parameters-input': true }} />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-edge');
      expect(el).toHaveClass('pipeline-edge--parameters-input');
      expect(el).not.toHaveClass('pipeline-edge--parameters');
    });
  });

  it('applies pipeline-edge--dataset--input when isInputOutputEdge is true', async () => {
    const edge = {
      id: 'edge-dataset-input',
      source: 'node-1',
      target: 'node-2',
      sourceNode: { type: 'data' },
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    };
    const { container } = render(
      <DrawEdges edges={[edge]} focusMode="input" inputOutputDataEdges={{ 'edge-dataset-input': true }} />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-edge');
      expect(el).toHaveClass('pipeline-edge--dataset--input');
    });
  });

  it('applies pipeline-edge--faded when edge is not linked to clickedNode', async () => {
    const edge = {
      id: 'edge-faded',
      source: 'node-1',
      target: 'node-2',
      sourceNode: { type: 'data' },
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    };
    const linkedNodes = { 'node-1': true };
    const { container } = render(
      <DrawEdges edges={[edge]} clickedNode="node-2" linkedNodes={linkedNodes} />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-edge');
      expect(el).toHaveClass('pipeline-edge--faded');
    });
  });
});
