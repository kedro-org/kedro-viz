import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { paths as nodeIcons } from '../icons/node-icon';
import { updateNodeRects } from './utils//updateNodeRect';
import { updateParameterRect } from './utils/updateParameterRect';
import { DURATION } from './utils/config';
import './styles/_node.scss';

/**
 * Functional React component for drawing nodes using D3
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
  showRunStatus = false,
  nodesStatus = {},
  dataSetsStatus = {},
}) {
  const groupRef = useRef();

  // Utility function to get D3 node selection and data join
  const getNodeSelections = (groupRef, nodes) => {
    if (!nodes.length) {
      return null;
    }
    const svg = d3.select(groupRef.current);
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
    return { svg, nodeSel, updateNodes, enterNodes, exitNodes, allNodes };
  };

  // --- Initial node creation and removal (enter/exit) ---
  useEffect(() => {
    const selections = getNodeSelections(groupRef, nodes);
    if (!selections) {
      return;
    }

    const { updateNodes, enterNodes, exitNodes } = selections;

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
  }, [
    nodes,
    onNodeClick,
    onNodeMouseOver,
    onNodeMouseOut,
    onNodeFocus,
    onNodeBlur,
    onNodeKeyDown,
    onParamsIndicatorMouseOver,
    orientation,
  ]);

  // --- Update node classes based on state (active, selected, etc) ---
  useEffect(() => {
    const selections = getNodeSelections(groupRef, nodes);
    if (!selections) {
      return;
    }

    const { allNodes } = selections;
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
        (node) =>
          (hoveredFocusMode && !nodeActive[node.id]) ||
          (clickedNode && !linkedNodes[node.id])
      );
  }, [
    nodes,
    nodeTypeDisabled,
    nodeActive,
    nodeSelected,
    hoveredParameters,
    hoveredFocusMode,
    nodesWithInputParams,
    clickedNode,
    linkedNodes,
    focusMode,
    inputOutputDataNodes,
    isSlicingPipelineApplied,
    slicedPipelineRange,
    slicedPipelineFromTo,
    isInputOutputNode,
  ]);

  // --- Animate node position and update rects on layout/orientation change ---
  useEffect(() => {
    const selections = getNodeSelections(groupRef, nodes);
    if (!selections) {
      return;
    }

    const { updateNodes, enterNodes, allNodes } = selections;
    allNodes
      .transition('update-nodes')
      .duration(DURATION)
      .attr('transform', (node) => `translate(${node.x}, ${node.y})`)
      .on('end', () => {
        try {
          allNodes.sort((a, b) => a.order - b.order);
        } catch (err) {
          // Avoid rare DOM errors thrown due to timing issues
        }
      });

    enterNodes
      .select('.pipeline-node__bg')
      .call(updateNodeRects, showRunStatus, nodesStatus, dataSetsStatus);
    updateNodes
      .select('.pipeline-node__bg')
      .transition('node-rect')
      .duration((node) => (node.showText ? 200 : 600))
      .call(updateNodeRects, showRunStatus, nodesStatus, dataSetsStatus);
    allNodes
      .select('.pipeline-node__parameter-indicator')
      .classed(
        'pipeline-node__parameter-indicator--visible',
        (node) => nodeTypeDisabled.parameters && nodesWithInputParams[node.id]
      )
      .transition('node-rect')
      .duration((node) => (node.showText ? 200 : 600))
      .call(updateParameterRect, orientation);
    allNodes
      .select('.pipeline-node__icon')
      .style('transition-delay', (node) => (node.showText ? '0ms' : '200ms'))
      .style(
        'transform',
        (node) =>
          `translate(${node.iconOffset}px, ${-node.iconSize / 2}px) scale(${
            node.iconSize / 24
          })`
      );
    allNodes
      .select('.pipeline-node__text')
      .text((node) => node.name)
      .style('transition-delay', (node) => (node.showText ? '200ms' : '0ms'))
      .style('opacity', (node) => (node.showText ? 1 : 0));
  }, [
    nodes,
    nodeTypeDisabled.parameters,
    nodesWithInputParams,
    orientation,
    nodeActive,
  ]);

  return <g id="nodes" className="pipeline-flowchart__nodes" ref={groupRef} />;
}

export default DrawNodes;
