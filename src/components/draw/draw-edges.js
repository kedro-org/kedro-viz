import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { limitPrecision } from './utils/draw-utils';
import { DURATION } from './utils/config';

import './styles/index.scss';

const lineShape = line()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveBasis);

/**
 * Functional React component for drawing edges using D3
 */
export function DrawEdges({
  edges = [],
  clickedNode = null,
  linkedNodes = {},
  focusMode = null,
  inputOutputDataEdges = {},
}) {
  const groupRef = useRef();

  const isInputOutputEdge = useCallback(
    (edgeID) => focusMode !== null && inputOutputDataEdges[edgeID],
    [focusMode, inputOutputDataEdges]
  );

  useEffect(() => {
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const edgeSel = svg.selectAll('.pipeline-edge').data(edges, (d) => d.id);

    const updateEdges = edgeSel;
    const enterEdges = edgeSel.enter().append('g');
    const exitEdges = edgeSel.exit();
    const allEdges = edgeSel
      .merge(enterEdges)
      .merge(exitEdges)
      .filter((edge) => edge);

    // ENTER
    enterEdges.append('path');
    enterEdges
      .attr('data-id', (edge) => edge.id)
      .attr('class', 'pipeline-edge')
      .attr('opacity', 0)
      .transition('show-edges')
      .duration(DURATION)
      .attr('opacity', 1);

    // EXIT
    exitEdges
      .transition('exit-edges')
      .duration(DURATION)
      .style('opacity', 0)
      .remove();
    // Cancel exit transitions if re-entered
    updateEdges.transition('exit-edges').style('opacity', null);

    // UPDATE/MERGE
    allEdges
      .select('path')
      .attr('marker-end', (edge) =>
        edge.sourceNode.type === 'parameters'
          ? isInputOutputEdge(edge.id)
            ? `url(#pipeline-arrowhead--accent--input)`
            : `url(#pipeline-arrowhead--accent)`
          : isInputOutputEdge(edge.id)
          ? `url(#pipeline-arrowhead--input)`
          : `url(#pipeline-arrowhead)`
      )
      .transition('update-edges')
      .duration(DURATION)
      .attrTween('d', function (edge) {
        // Performance: Limit path precision for parsing & render
        let current = edge.points && limitPrecision(lineShape(edge.points));
        const previous = select(this).attr('d') || current;
        return interpolatePath(previous, current);
      });

    allEdges
      .classed(
        'pipeline-edge--parameters',
        (edge) =>
          edge.sourceNode.type === 'parameters' && !isInputOutputEdge(edge.id)
      )
      .classed(
        'pipeline-edge--parameters-input',
        (edge) =>
          edge.sourceNode.type === 'parameters' && isInputOutputEdge(edge.id)
      )
      .classed('pipeline-edge--dataset--input', (edge) =>
        isInputOutputEdge(edge.id)
      )
      .classed(
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
    isInputOutputEdge,
  ]);

  // Parent group for all edges
  return <g className="pipeline-flowchart__edges" ref={groupRef} />;
}

export default DrawEdges;
