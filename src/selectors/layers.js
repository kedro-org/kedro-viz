import { createSelector } from 'reselect';
import { getLayoutNodes } from './layout';

const WIDTH = Math.pow(2, 18);

const getLayerIDs = state => state.layer.ids;
const getLayerName = state => state.layer.name;

/**
 * Get layer positions
 */
export const getLayers = createSelector(
  [getLayoutNodes, getLayerIDs, getLayerName],
  (nodes, layerIDs, layerName) => {
    // Get list of layer Y positions from nodes
    const layerY = nodes.reduce((layerY, node) => {
      if (!layerY[node.layer]) {
        layerY[node.layer] = [node.y];
      } else {
        layerY[node.layer].push(node.y);
      }
      return layerY;
    }, {});

    /**
     * Determine the y position and height of a layer band
     * @param {number} id
     */
    const calculateYPos = id => {
      const yMin = Math.min(...layerY[id]);
      const yMax = Math.max(...layerY[id]);
      const prev = layerY[id - 1];
      const next = layerY[id + 1];
      const topYGap = prev && yMin - Math.max(...prev);
      const bottomYGap = next && Math.min(...next) - yMax;
      const yGap = (topYGap || bottomYGap) / 2;
      const y = yMin - yGap;
      const height = yMax + yGap - y;
      return { y, height };
    };

    const layers = [];
    for (const id of layerIDs) {
      if (layerY[id]) {
        layers.push({
          id,
          name: layerName[id],
          x: WIDTH / -2,
          width: WIDTH,
          ...calculateYPos(id)
        });
      }
    }
    return layers;
  }
);
