import { useEffect } from 'react';
import * as d3 from 'd3';

import './styles/_layers.scss';

/**
 * Functional React component for drawing layer bands using D3
 * Props: layers (array), onLayerMouseOver, onLayerMouseOut, layersRef
 */
export function DrawLayers({
  layers = [],
  onLayerMouseOver,
  onLayerMouseOut,
  layersRef,
}) {
  useEffect(() => {
    if (!layersRef?.current || !layers.length) {
      return;
    }
    const svg = d3.select(layersRef.current);
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
  }, [layers, onLayerMouseOver, onLayerMouseOut, layersRef]);

  return null;
}

/**
 * Wrapper component for the layers group and DrawLayers.
 * Allows usage as <PipelineLayersGroup ... /> in flowchart.
 */
export function DrawLayersGroup({
  layers,
  layersRef,
  onLayerMouseOver,
  onLayerMouseOut,
}) {
  return (
    <g className="pipeline-flowchart__layers" ref={layersRef}>
      <DrawLayers
        layers={layers}
        layersRef={layersRef}
        onLayerMouseOver={onLayerMouseOver}
        onLayerMouseOut={onLayerMouseOut}
      />
    </g>
  );
}
