import { createSelector } from 'reselect';
import { getVisibleLayerIDs } from './disabled';

const getGraph = (state) => state.graph;
const getLayerName = (state) => state.layer.name;
const getFlowChartOrientation = (state) => state.orientation;

/**
 * Get layer positions
 */
export const getLayers = createSelector(
  [getGraph, getVisibleLayerIDs, getLayerName, getFlowChartOrientation],
  ({ nodes, size }, layerIDs, layerName, orientation) => {
    if (!nodes || !size || !nodes.length || !layerIDs.length) {
      return [];
    }
    const { width, height } = size;

    const bounds = {};

    for (const node of nodes) {
      const layer = node.nearestLayer || node.layer;

      if (layer) {
        const bound = bounds[layer] || (bounds[layer] = [Infinity, -Infinity]);

        if (orientation === 'vertical') {
          if (node.y - node.height < bound[0]) {
            bound[0] = node.y - node.height;
          }

          if (node.y + node.height > bound[1]) {
            bound[1] = node.y + node.height;
          }
        } else {
          if (node.x - node.width < bound[0]) {
            bound[0] = node.x - node.width;
          }

          if (node.x + node.width > bound[1]) {
            bound[1] = node.x + node.width;
          }
        }
      }
    }

    return layerIDs.map((id, i) => {
      const currentBound = bounds[id] || [0, 0];
      const prevBound = bounds[layerIDs[i - 1]] || [
        currentBound[0],
        currentBound[0],
      ];
      const nextBound = bounds[layerIDs[i + 1]] || [
        currentBound[1],
        currentBound[1],
      ];
      const start = (prevBound[1] + currentBound[0]) / 2;
      const end = (currentBound[1] + nextBound[0]) / 2;
      const rectSize = Math.max(width, height) * 5;

      if (orientation === 'vertical') {
        // Vertical layout when orientation is vertical
        return {
          id,
          name: layerName[id],
          y: start, // Vertical layout moves along the y-axis
          x: (rectSize - width) / -2, // Centered along x-axis
          height: Math.max(end - start, 0),
          width: rectSize,
        };
      }
      return {
        id,
        name: layerName[id],
        x: start, // Horizontal layout moves along the x-axis
        y: (rectSize - height) / -2, // Centered along y-axis
        width: Math.max(end - start, 0),
        height: rectSize,
      };
    });
  }
);
