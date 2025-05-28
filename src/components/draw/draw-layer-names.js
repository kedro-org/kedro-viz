import { useEffect } from 'react';
import * as d3 from 'd3';
import classnames from 'classnames';
import { LAYER_NAME_DURATION } from './config';

/**
 * Functional React component for drawing layer name labels using D3
 * Props: layers (array), chartSize (object), orientation (string), LAYER_NAME_DURATION (number)
 */
export function DrawLayerNames({
  layers = [],
  chartSize = {},
  orientation = 'vertical',
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
        ? `translateX(${layerNamePosition}px)`
        : `translateY(${layerNamePosition}px)`;

    svg
      .transition('layer-names-sidebar-width')
      .duration(LAYER_NAME_DURATION)
      .style('transform', transformValue);

    // DATA JOIN
    let layerNames = svg
      .selectAll('.pipeline-layer-name')
      .data(layers, (d) => d.id);

    // ENTER
    const enterLayerNames = layerNames
      .enter()
      .append('li')
      .attr('class', 'pipeline-layer-name')
      .attr('data-id', (d) => `layer-label--${d.name}`);

    enterLayerNames
      .style('opacity', 0)
      .transition('enter-layer-names')
      .duration(LAYER_NAME_DURATION)
      .style('opacity', 0.55);

    // EXIT
    layerNames
      .exit()
      .style('opacity', 0.55)
      .transition('exit-layer-names')
      .duration(LAYER_NAME_DURATION)
      .style('opacity', 0)
      .remove();

    // MERGE
    layerNames = layerNames.merge(enterLayerNames);
    layerNames.text((d) => d.name).attr('dy', 5);
  }, [layers, chartSize, orientation, layerNamesRef]);

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
