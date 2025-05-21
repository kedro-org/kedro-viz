import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Functional React component for drawing layer bands using D3
 * Props: layers (array), onLayerMouseOver, onLayerMouseOut
 */
export function DrawLayers({ layers = [], onLayerMouseOver, onLayerMouseOut }) {
  const groupRef = useRef();

  useEffect(() => {
    if (!layers.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    // DATA JOIN
    const layerSel = svg.selectAll('.pipeline-layer').data(layers, (d) => d.id);
    // ENTER
    const enterLayers = layerSel
      .enter()
      .append('rect')
      .attr('class', 'pipeline-layer');
    if (onLayerMouseOver) {
      enterLayers.on('mouseover', onLayerMouseOver);
    }
    if (onLayerMouseOut) {
      enterLayers.on('mouseout', onLayerMouseOut);
    }
    // EXIT
    layerSel.exit().remove();
    // UPDATE
    const allLayers = layerSel.merge(enterLayers);
    allLayers
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('height', (d) => d.height)
      .attr('width', (d) => d.width);
  }, [layers, onLayerMouseOver, onLayerMouseOut]);

  return <g ref={groupRef} />;
}

export default DrawLayers;
