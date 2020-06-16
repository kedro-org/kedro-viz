import { createSelector } from 'reselect';
import { getLayoutNodes, getGraphSize } from './layout';
import { getVisibleLayerIDs } from './disabled';

const getLayerName = state => state.layer.name;

/**
 * Get layer positions
 */
export const getLayers = createSelector(
  [getLayoutNodes, getVisibleLayerIDs, getLayerName, getGraphSize],
  (nodes, layerIDs, layerName, { width }) => {
    if (!nodes.length) {
      return [];
    }

    // Get list of layer Y positions from nodes
    const layerY = nodes.reduce((layerY, node) => {
      if (!layerY[node.layer]) {
        layerY[node.layer] = [];
      }
      layerY[node.layer].push(node.y);
      return layerY;
    }, {});

    /**
     * Determine the y position and height of a layer band
     * @param {number} id
     */
    const calculateYPos = (layerID, prevID, nextID) => {
      const yMin = Math.min(...layerY[layerID]);
      const yMax = Math.max(...layerY[layerID]);
      const prev = layerY[prevID];
      const next = layerY[nextID];
      const topYGap = prev && yMin - Math.max(...prev);
      const bottomYGap = next && Math.min(...next) - yMax;
      const yGap = (topYGap || bottomYGap) / 2;
      const y = yMin - yGap;
      const height = yMax + yGap - y;
      return { y, height };
    };

    return layerIDs.map((id, i) => {
      const prevID = layerIDs[i - 1];
      const nextID = layerIDs[i + 1];
      return {
        id,
        name: layerName[id],
        x: -width / 2,
        width: width * 2,
        ...calculateYPos(id, prevID, nextID)
      };
    });
  }
);
