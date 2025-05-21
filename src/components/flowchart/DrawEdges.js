import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { limitPrecision } from './draw-utils';

const lineShape = line()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveBasis);

/**
 * Functional React component for drawing edges using D3
 * Props: edges (array), clickedNode, linkedNodes, focusMode, inputOutputDataEdges, duration (number)
 */
export function DrawEdges({
  edges = [],
  clickedNode = null,
  linkedNodes = {},
  focusMode = null,
  inputOutputDataEdges = {},
  duration = 400,
}) {
  const groupRef = useRef();

  useEffect(() => {
    if (!edges.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const edgeSel = svg.selectAll('.pipeline-edge').data(edges, (d) => d.id);
    // ENTER
    const enterEdges = edgeSel
      .enter()
      .append('g')
      .attr('class', 'pipeline-edge');
    enterEdges.append('path');
    // EXIT
    edgeSel.exit().remove();
    // UPDATE
    const allEdges = edgeSel.merge(enterEdges);
    allEdges
      .select('path')
      .transition('update-edges')
      .duration(duration)
      .attrTween('d', function (edge) {
        let current = edge.points && limitPrecision(lineShape(edge.points));
        const previous = select(this).attr('d') || current;
        return interpolatePath(previous, current);
      });
    // Example: marker-end logic (customize as needed)
    allEdges.select('path').attr('marker-end', (edge) => {
      // You may want to pass marker logic as a prop for full flexibility
      return 'url(#pipeline-arrowhead)';
    });
    // Example: class logic (customize as needed)
    allEdges.classed(
      'pipeline-edge--faded',
      (edge) =>
        edge &&
        clickedNode &&
        (!linkedNodes[edge.source] || !linkedNodes[edge.target])
    );
  }, [
    edges,
    clickedNode,
    linkedNodes,
    focusMode,
    inputOutputDataEdges,
    duration,
  ]);

  return <g ref={groupRef} />;
}

export default DrawEdges;
