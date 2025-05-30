import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { paths as nodeIcons } from '../icons/node-icon';
import { updateNodeRects } from './updateNodeRect';
import { updateParameterRect } from './updateParameterRect';
import { DURATION } from './config';

import './styles/_node.scss';

/**
 * Functional React component for drawing nodes using D3r
 */
export function DrawNodes({
  nodes = [],
  nodeActive = {},
  nodeSelected = {},
  nodeTypeDisabled = {},
  hoveredParameters = null,
  hoveredFocusMode = null,
  nodesWithInputParams = {},
  inputOutputDataNodes = {},
  focusMode = null,
  orientation = 'vertical',
  nodeStatusMap = {},
  nodeDurationMap = {},
  nodeOutlineMap = {},
  onNodeClick,
  onNodeMouseOver,
  onNodeMouseOut,
  onNodeFocus,
  onNodeBlur,
  onNodeKeyDown,
  onParamsIndicatorMouseOver,
  isSlicingPipelineApplied = false,
  slicedPipelineFromTo = {},
  slicedPipelineRange = {},
  isInputOutputNode = () => false,
  clickedNode = null,
  linkedNodes = {},
}) {
  const groupRef = useRef();
  // FIRST
  useEffect(() => {
    if (!nodes.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const nodeSel = svg
      .selectAll('.pipeline-node')
      .data(nodes, (node) => node.id);
    const updateNodes = nodeSel;
    const enterNodes = nodeSel.enter().append('g');
    const exitNodes = nodeSel.exit();
    // Filter out undefined nodes on Safari
    const allNodes = updateNodes
      .merge(enterNodes)
      .merge(exitNodes)
      .filter((node) => typeof node !== 'undefined');

    enterNodes
      .attr('tabindex', '0')
      .attr('class', 'pipeline-node')
      .attr('transform', (node) => `translate(${node.x}, ${node.y})`)
      .attr('data-id', (node) => node.id)
      .classed(
        'pipeline-node--parameters',
        (node) => node.type === 'parameters'
      )
      .classed('pipeline-node--data', (node) => node.type === 'data')
      .classed('pipeline-node--task', (node) => node.type === 'task')
      .on('click', onNodeClick)
      .on('mouseover', onNodeMouseOver)
      .on('mouseout', onNodeMouseOut)
      .on('focus', onNodeFocus || onNodeMouseOver)
      .on('blur', onNodeBlur || onNodeMouseOut)
      .on('keydown', onNodeKeyDown);

    enterNodes
      .attr('opacity', 0)
      .transition('show-nodes')
      .duration(DURATION)
      .attr('opacity', 1);

    enterNodes
      .append('rect')
      .attr(
        'class',
        (node) =>
          `pipeline-node__bg pipeline-node__bg--${node.type} pipeline-node__bg--${node.icon}`
      );

    enterNodes
      .append('rect')
      .attr('class', 'pipeline-node__parameter-indicator')
      .on('mouseover', onParamsIndicatorMouseOver)
      .call(updateParameterRect, orientation);

    // Performance: use a single path per icon
    enterNodes
      .append('path')
      .attr('class', 'pipeline-node__icon')
      .attr('d', (node) => nodeIcons[node.icon]);

    enterNodes
      .append('text')
      .attr('class', 'pipeline-node__text')
      .text((node) => node.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('dx', (node) => node.textOffset);

    exitNodes
      .transition('exit-nodes')
      .duration(DURATION)
      .style('opacity', 0)
      .remove();

    // Cancel exit transitions if re-entered
    updateNodes.transition('exit-nodes').style('opacity', null);

    // this.el.nodes = this.el.nodeGroup.selectAll('.pipeline-node');
  }, [nodes]);

  // SECOND EFFECT
  useEffect(() => {
    if (!nodes.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const nodeSel = svg
      .selectAll('.pipeline-node')
      .data(nodes, (node) => node.id);
    const updateNodes = nodeSel;
    const enterNodes = nodeSel.enter().append('g');
    const exitNodes = nodeSel.exit();
    // Filter out undefined nodes on Safari
    const allNodes = updateNodes
      .merge(enterNodes)
      .merge(exitNodes)
      .filter((node) => typeof node !== 'undefined');

    allNodes
      .classed('pipeline-node--active', (node) => nodeActive[node.id])
      .classed('pipeline-node--selected', (node) => nodeSelected[node.id])
      .classed(
        'pipeline-node--sliced-pipeline',
        (node) => !isSlicingPipelineApplied && slicedPipelineRange[node.id]
      )
      .classed(
        'pipeline-node--from-to-sliced-pipeline',
        (node) =>
          !isSlicingPipelineApplied &&
          slicedPipelineFromTo &&
          slicedPipelineFromTo[node.id]
      )
      .classed(
        'pipeline-node--collapsed-hint',
        (node) =>
          hoveredParameters &&
          nodesWithInputParams[node.id] &&
          nodeTypeDisabled.parameters
      )
      .classed(
        'pipeline-node--dataset-input',
        (node) => isInputOutputNode(node.id) && node.type === 'data'
      )
      .classed(
        'pipeline-node--parameter-input',
        (node) => isInputOutputNode(node.id) && node.type === 'parameters'
      )
      .classed(
        'pipeline-node-input--active',
        (node) => isInputOutputNode(node.id) && nodeActive[node.id]
      )
      .classed(
        'pipeline-node-input--selected',
        (node) => isInputOutputNode(node.id) && nodeSelected[node.id]
      )
      .classed(
        'pipeline-node--faded',
        (node) => clickedNode && !linkedNodes[node.id]
      );
  }, [
    nodes,
    nodeTypeDisabled,
    nodeActive,
    nodeSelected,
    hoveredParameters,
    nodesWithInputParams,
    clickedNode,
    linkedNodes,
    focusMode,
    inputOutputDataNodes,
  ]);

  // UPDATE WHEN HOVERED/ACTIVE NODES
  useEffect(() => {
    if (!nodes.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const nodeSel = svg
      .selectAll('.pipeline-node')
      .data(nodes, (node) => node.id);
    const updateNodes = nodeSel;
    const enterNodes = nodeSel.enter().append('g');
    const exitNodes = nodeSel.exit();
    // Filter out undefined nodes on Safari
    const allNodes = updateNodes
      .merge(enterNodes)
      .merge(exitNodes)
      .filter((node) => typeof node !== 'undefined');

    allNodes.classed(
      'pipeline-node--faded',
      (node) => hoveredFocusMode && !nodeActive[node.id]
    );
  }, [hoveredFocusMode, nodeActive, nodes]);

  // UPDATE WHEN NODES CHANGED, eg: LAYOUT ETC
  useEffect(() => {
    if (!nodes.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const nodeSel = svg
      .selectAll('.pipeline-node')
      .data(nodes, (node) => node.id);
    const updateNodes = nodeSel;
    const enterNodes = nodeSel.enter().append('g');
    const exitNodes = nodeSel.exit();
    // Filter out undefined nodes on Safari
    const allNodes = updateNodes
      .merge(enterNodes)
      .merge(exitNodes)
      .filter((node) => typeof node !== 'undefined');

    allNodes
      .transition('update-nodes')
      .duration(DURATION)
      .attr('transform', (node) => `translate(${node.x}, ${node.y})`)
      .on('end', () => {
        try {
          // Sort nodes so tab focus order follows X/Y position
          allNodes.sort((a, b) => a.order - b.order);
        } catch (err) {
          // Avoid rare DOM errors thrown due to timing issues
        }
      });

    enterNodes.select('.pipeline-node__bg').call(updateNodeRects);

    updateNodes
      .select('.pipeline-node__bg')
      .transition('node-rect')
      .duration((node) => (node.showText ? 200 : 600))
      .call(updateNodeRects);
    allNodes
      .select('.pipeline-node__parameter-indicator')
      .classed(
        'pipeline-node__parameter-indicator--visible',
        (node) => nodeTypeDisabled.parameters && nodesWithInputParams[node.id]
      )
      .transition('node-rect')
      .duration((node) => (node.showText ? 200 : 600))
      .call(updateParameterRect, orientation);

    // Performance: icon transitions with CSS on GPU
    allNodes
      .select('.pipeline-node__icon')
      .style('transition-delay', (node) => (node.showText ? '0ms' : '200ms'))
      .style(
        'transform',
        (node) =>
          `translate(${node.iconOffset}px, ${-node.iconSize / 2}px) ` +
          `scale(${node.iconSize / 24})`
      );

    // Performance: text transitions with CSS on GPU
    allNodes
      .select('.pipeline-node__text')
      .text((node) => node.name)
      .style('transition-delay', (node) => (node.showText ? '200ms' : '0ms'))
      .style('opacity', (node) => (node.showText ? 1 : 0));
  }, [nodes, nodeTypeDisabled.parameters, nodesWithInputParams, orientation]);

  return <g id="nodes" className="pipeline-flowchart__nodes" ref={groupRef} />;
}

export default DrawNodes;
