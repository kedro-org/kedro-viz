import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DrawEdges from './draw-edges';

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

  it('renders the edges group', () => {
    const edges = [
      { ...baseEdge, id: 'edge-1' },
      { ...baseEdge, id: 'edge-2', source: 'node-2', target: 'node-3' },
    ];
    const { container } = render(<DrawEdges edges={edges} />);
    const group = container.querySelector('g.pipeline-flowchart__edges');
    expect(group).toBeInTheDocument();
  });
});
