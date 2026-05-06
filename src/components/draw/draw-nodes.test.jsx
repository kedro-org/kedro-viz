import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DrawNodes from './draw-nodes';

describe('DrawNodes', () => {
  afterEach(cleanup);

  const baseNode = {
    id: 'node-1',
    name: 'Node 1',
    type: 'data',
    icon: 'dataset',
    iconOffset: 0,
    iconSize: 24,
    textOffset: 0,
    x: 0,
    y: 0,
    order: 1,
    showText: true,
  };

  it('renders without crashing', () => {
    render(<DrawNodes nodes={[]} />);
  });

  it('renders the nodes group', () => {
    const { container } = render(<DrawNodes nodes={[baseNode]} />);
    expect(
      container.querySelector('.pipeline-flowchart__nodes')
    ).toBeInTheDocument();
  });

  it('renders data-node-type attribute on nodes', () => {
    const taskNode = { ...baseNode, type: 'task' };
    const { container } = render(<DrawNodes nodes={[taskNode]} />);
    const nodeEl = container.querySelector('[data-node-type="task"]');
    expect(nodeEl).toBeInTheDocument();
  });

  it('renders data-node-fullname attribute on nodes', () => {
    const taskNode = {
      ...baseNode,
      type: 'task',
      fullName: 'my_pipeline.split_data',
    };
    const { container } = render(<DrawNodes nodes={[taskNode]} />);
    const nodeEl = container.querySelector(
      '[data-node-fullname="my_pipeline.split_data"]'
    );
    expect(nodeEl).toBeInTheDocument();
  });
});
