import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Functional React component for drawing layer name labels using D3
 * Props: layers (array), chartSize (object), orientation (string), layerNameDuration (number)
 */
export function DrawLayerNames({
  layers = [],
  chartSize = {},
  orientation = 'vertical',
  layerNameDuration = 400,
}) {
  const groupRef = useRef();

  useEffect(() => {
    if (!layers.length) {
      return;
    }
    const svg = d3.select(groupRef.current);
    const layerPaddingVerticalMode = 20;
    const layerNamePosition =
      orientation === 'vertical'
        ? (chartSize.sidebarWidth || 0) + layerPaddingVerticalMode
        : 100;
    const transformValue =
      orientation === 'vertical'
        ? `translateX(${layerNamePosition}px)`
        : `translateY(${layerNamePosition}px)`;
    svg
      .transition('layer-names-sidebar-width')
      .duration(layerNameDuration)
      .style('transform', transformValue);
    // DATA JOIN
    const nameSel = svg
      .selectAll('.pipeline-layer-name')
      .data(layers, (d) => d.id);
    // ENTER
    const enterNames = nameSel
      .enter()
      .append('li')
      .attr('class', 'pipeline-layer-name')
      .attr('data-id', (d) => `layer-label--${d.name}`);
    enterNames
      .style('opacity', 0)
      .transition('enter-layer-names')
      .duration(layerNameDuration)
      .style('opacity', 0.55);
    // EXIT
    nameSel
      .exit()
      .style('opacity', 0.55)
      .transition('exit-layer-names')
      .duration(layerNameDuration)
      .style('opacity', 0)
      .remove();
    // UPDATE
    const allNames = nameSel.merge(enterNames);
    allNames.text((d) => d.name).attr('dy', 5);
  }, [layers, chartSize, orientation, layerNameDuration]);

  return <ul ref={groupRef} className="pipeline-layer-names" />;
}

export default DrawLayerNames;
