import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { paths as nodeIcons } from '../icons/node-icon';
import { updateNodeRects } from '../flowchart/updateNodeRect';
import { updateParameterRect } from '../flowchart/updateParameterRect';
import { renderNodeDetails } from '../flowchart/renderNodeDetails';

/**
 * Functional React component for drawing nodes using D3
 * Props should include all data and config needed for node rendering
 */
export function DrawNodes({
  nodes = [],
  nodeActive = {},
  nodeSelected = {},
  nodeTypeDisabled = {},
  hoveredParameters = null,
  nodesWithInputParams = {},
  inputOutputDataNodes = {},
  focusMode = null,
  orientation = 'vertical',
  nodeStatusMap = {},
  nodeDurationMap = {},
  nodeOutlineMap = {},
  ...rest
}) {
  const groupRef = useRef();

  useEffect(() => {
    if (!nodes.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const nodeSel = svg.selectAll('.pipeline-node').data(nodes, (d) => d.id);
    // EXIT
    nodeSel.exit().remove();
    // ENTER
    const enterNodes = nodeSel
      .enter()
      .append('g')
      .attr('class', (d) => {
        let base = 'pipeline-node';
        if (d.type) {
          base += ` pipeline-node--${d.type}`;
        }
        return base;
      })
      .attr('tabindex', 0)
      .attr('data-id', (d) => d.id)
      .attr('opacity', 1);
    enterNodes
      .append('rect')
      .attr(
        'class',
        (d) =>
          `pipeline-node__bg pipeline-node__bg--${d.type} pipeline-node__bg--${d.icon}`
      );
    enterNodes
      .append('rect')
      .attr('class', 'pipeline-node__parameter-indicator');
    enterNodes
      .append('path')
      .attr('class', 'pipeline-node__icon')
      .attr('d', (d) => nodeIcons[d.icon] || '')
      .attr('style', (d) => {
        // Use d.iconOffset if available, else fallback to 0
        const iconOffset =
          d.iconOffset !== undefined
            ? d.iconOffset
            : d.textOffset !== undefined
            ? d.textOffset - 57
            : 0;
        return `transition-delay: 0ms; transform: translate(${iconOffset}px, -12px) scale(1);`;
      });
    enterNodes
      .append('text')
      .attr('class', 'pipeline-node__text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('dx', (d) => d.textOffset)
      .attr('style', 'transition-delay: 200ms; opacity: 1;');
    // UPDATE
    const allNodes = nodeSel.merge(enterNodes);
    allNodes
      .attr('tabindex', 0)
      .attr('data-id', (d) => d.id)
      .attr('opacity', 1)
      .attr('class', (d) => {
        let base = 'pipeline-node';
        if (d.type) {
          base += ` pipeline-node--${d.type}`;
        }
        return base;
      })
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    allNodes.select('.pipeline-node__bg').call(updateNodeRects);
    allNodes
      .select('.pipeline-node__parameter-indicator')
      .call(updateParameterRect, orientation);
    allNodes
      .select('.pipeline-node__icon')
      .attr('d', (d) => nodeIcons[d.icon] || '')
      .attr('style', (d) => {
        const iconOffset =
          d.iconOffset !== undefined
            ? d.iconOffset
            : d.textOffset !== undefined
            ? d.textOffset - 57
            : 0;
        return `transition-delay: 0ms; transform: translate(${iconOffset}px, -12px) scale(1);`;
      });
    allNodes
      .select('.pipeline-node__text')
      .text((d) => d.name)
      .attr('style', 'transition-delay: 200ms; opacity: 1;');
    // Render node details (status, duration, outlines)
    renderNodeDetails(allNodes, {
      statusMap: nodeStatusMap,
      durationMap: nodeDurationMap,
      outlineMap: nodeOutlineMap,
    });
    // Class updates (example, can be extended)
    allNodes.classed('pipeline-node--active', (d) => nodeActive[d.id]);
    allNodes.classed('pipeline-node--selected', (d) => nodeSelected[d.id]);
    allNodes.classed(
      'pipeline-node--parameters',
      (d) => d.type === 'parameters'
    );
    allNodes.classed('pipeline-node--data', (d) => d.type === 'data');
    allNodes.classed('pipeline-node--task', (d) => d.type === 'task');
  }, [
    nodes,
    nodeActive,
    nodeSelected,
    nodeTypeDisabled,
    hoveredParameters,
    nodesWithInputParams,
    inputOutputDataNodes,
    focusMode,
    orientation,
    nodeStatusMap,
    nodeDurationMap,
    nodeOutlineMap,
  ]);

  // Parent group for all nodes
  return <g id="nodes" className="pipeline-flowchart__nodes" ref={groupRef} />;
}

export default DrawNodes;
