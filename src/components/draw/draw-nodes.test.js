import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as d3 from 'd3';
import DrawNodes from './draw-nodes';

// Mock d3 transitions and selection methods that are not supported in JSDOM
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
d3.selection.prototype.call = function () {
    return this;
};
d3.selection.prototype.append = function () {
    return this;
};
d3.selection.prototype.attr = function () {
    return this;
};
d3.selection.prototype.text = function () {
    return this;
};
d3.selection.prototype.classed = function () {
    return this;
};
d3.selection.prototype.select = function () {
    return this;
};

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

  it('applies pipeline-node--active and pipeline-node--selected', async () => {
    const node = { ...baseNode, id: 'node-active', name: 'Active Node' };
    const nodeActive = { 'node-active': true };
    const nodeSelected = { 'node-active': true };
    const { container } = render(
      <DrawNodes nodes={[node]} nodeActive={nodeActive} nodeSelected={nodeSelected} />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-node');
      expect(el).toHaveClass('pipeline-node--active');
      expect(el).toHaveClass('pipeline-node--selected');
    });
  });

  it('applies pipeline-node--parameters, pipeline-node--data, pipeline-node--task', async () => {
    const nodes = [
      { ...baseNode, id: 'n1', type: 'parameters', icon: 'parameters' },
      { ...baseNode, id: 'n2', type: 'data', icon: 'dataset' },
      { ...baseNode, id: 'n3', type: 'task', icon: 'task' },
    ];
    const { container } = render(<DrawNodes nodes={nodes} />);
    await waitFor(() => {
      expect(container.querySelector('.pipeline-node--parameters')).toBeInTheDocument();
      expect(container.querySelector('.pipeline-node--data')).toBeInTheDocument();
      expect(container.querySelector('.pipeline-node--task')).toBeInTheDocument();
    });
  });

  it('applies pipeline-node--sliced-pipeline and pipeline-node--from-to-sliced-pipeline', async () => {
    const node = { ...baseNode, id: 'node-slice' };
    const slicedPipelineRange = { 'node-slice': true };
    const slicedPipelineFromTo = { 'node-slice': true };
    const { container } = render(
      <DrawNodes
        nodes={[node]}
        slicedPipelineRange={slicedPipelineRange}
        slicedPipelineFromTo={slicedPipelineFromTo}
        isSlicingPipelineApplied={false}
      />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-node');
      expect(el).toHaveClass('pipeline-node--sliced-pipeline');
      expect(el).toHaveClass('pipeline-node--from-to-sliced-pipeline');
    });
  });

  it('applies pipeline-node--collapsed-hint', async () => {
    const node = { ...baseNode, id: 'node-collapsed' };
    const nodesWithInputParams = { 'node-collapsed': true };
    const nodeTypeDisabled = { parameters: true };
    const { container } = render(
      <DrawNodes
        nodes={[node]}
        hoveredParameters={true}
        nodesWithInputParams={nodesWithInputParams}
        nodeTypeDisabled={nodeTypeDisabled}
      />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-node');
      expect(el).toHaveClass('pipeline-node--collapsed-hint');
    });
  });

  it('applies pipeline-node--dataset-input and pipeline-node--parameter-input', async () => {
    const dataNode = { ...baseNode, id: 'data-input', type: 'data' };
    const paramNode = { ...baseNode, id: 'param-input', type: 'parameters' };
    const isInputOutputNode = (id) => id === 'data-input' || id === 'param-input';
    const { container } = render(
      <DrawNodes
        nodes={[dataNode, paramNode]}
        isInputOutputNode={isInputOutputNode}
      />
    );
    await waitFor(() => {
      expect(container.querySelector('.pipeline-node--dataset-input')).toBeInTheDocument();
      expect(container.querySelector('.pipeline-node--parameter-input')).toBeInTheDocument();
    });
  });

  it('applies pipeline-node-input--active and pipeline-node-input--selected', async () => {
    const node = { ...baseNode, id: 'input-active', type: 'data' };
    const isInputOutputNode = (id) => id === 'input-active';
    const nodeActive = { 'input-active': true };
    const nodeSelected = { 'input-active': true };
    const { container } = render(
      <DrawNodes
        nodes={[node]}
        isInputOutputNode={isInputOutputNode}
        nodeActive={nodeActive}
        nodeSelected={nodeSelected}
      />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-node');
      expect(el).toHaveClass('pipeline-node-input--active');
      expect(el).toHaveClass('pipeline-node-input--selected');
    });
  });

  it('applies pipeline-node--faded for hoveredFocusMode or not linked to clickedNode', async () => {
    const node = { ...baseNode, id: 'faded-node' };
    const nodeActive = { 'faded-node': false };
    const linkedNodes = { 'other-node': true };
    const { container } = render(
      <DrawNodes
        nodes={[node]}
        hoveredFocusMode={true}
        nodeActive={nodeActive}
        clickedNode={'faded-node'}
        linkedNodes={linkedNodes}
      />
    );
    await waitFor(() => {
      const el = container.querySelector('.pipeline-node');
      expect(el).toHaveClass('pipeline-node--faded');
    });
  });
});
