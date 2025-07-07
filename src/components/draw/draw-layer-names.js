import React, { useEffect } from 'react';
import * as d3 from 'd3';
import classnames from 'classnames';

import './styles/index.scss';

/**
 * Functional React component for drawing layer name labels using D3
 */
export function DrawLayerNames({
  layers = [],
  chartSize = {},
  orientation = 'vertical',
  layerNameDuration = 400,
  layerNamesRef,
}) {
  useEffect(() => {
    if (!layerNamesRef?.current || !layers.length) {
      return;
    }
    const svg = d3.select(layerNamesRef.current);
    const layerPaddingVerticalMode = 20;
    const layerNamePosition =
      orientation === 'vertical'
        ? (chartSize.sidebarWidth || 0) + layerPaddingVerticalMode
        : 100;

    const transformValue =
      orientation === 'vertical'
        ? // In vertical mode, layer names are positioned along the X-axis at sidebarWidth
          `translateX(${layerNamePosition}px)`
        : // In horizontal mode, layer names are positioned at a fixed Y = 100px
          `translateY(${layerNamePosition}px)`;

    svg
      .transition('layer-names-sidebar-width')
      .duration(layerNameDuration)
      .style('transform', transformValue);

    // DATA JOIN
    const layerNameElement = svg
      .selectAll('.pipeline-layer-name')
      .data(layers, (d) => d.id);

    // ENTER
    const enterLayerNames = layerNameElement
      .enter()
      .append('li')
      .attr('class', 'pipeline-layer-name')
      .attr('data-id', (d) => `layer-label--${d.name}`);

    enterLayerNames
      .style('opacity', 0)
      .transition('enter-layer-names')
      .duration(layerNameDuration)
      .style('opacity', 0.55);

    // EXIT
    layerNameElement
      .exit()
      .style('opacity', 0.55)
      .transition('exit-layer-names')
      .duration(layerNameDuration)
      .style('opacity', 0)
      .remove();

    // UPDATE
    const allNames = layerNameElement.merge(enterLayerNames);
    allNames.text((d) => d.name).style('opacity', 0.55);
  }, [layers, chartSize, orientation, layerNameDuration, layerNamesRef]);

  return null;
}

export function DrawLayerNamesGroup({
  layers,
  chartSize,
  orientation,
  displayGlobalNavigation,
  displaySidebar,
  layerNamesRef,
}) {
  if (!layers.length) {
    return null;
  }
  return (
    <ul
      className={classnames('pipeline-flowchart__layer-names', {
        'pipeline-flowchart__layer-names--visible': layers.length,
        'pipeline-flowchart__layer-names--no-global-toolbar':
          !displayGlobalNavigation,
        'pipeline-flowchart__layer-names--no-sidebar': !displaySidebar,
      })}
      ref={layerNamesRef}
    >
      <DrawLayerNames
        layers={layers}
        chartSize={chartSize}
        orientation={orientation}
        layerNamesRef={layerNamesRef}
      />
    </ul>
  );
}
