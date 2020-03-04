import { createSelector } from 'reselect';
import { getLayoutNodes } from './layout';
import { LOREM_IPSUM } from '../utils';

const WIDTH = Math.pow(2, 18);

/**
 * Get layer positions
 */
export const getLayers = createSelector(
  [getLayoutNodes],
  nodes => {
    const layerY = {};
    nodes.forEach(node => {
      if (!layerY[node.rank]) {
        layerY[node.rank] = node.y;
      }
    });

    return Object.keys(layerY).map((rank, i) => {
      const neighbourY = layerY[i - 1] || layerY[i + 1];
      const height = Math.abs(layerY[i] - neighbourY);

      return {
        rank,
        name: LOREM_IPSUM[i],
        x: WIDTH / -2,
        y: layerY[i] - height / 2,
        width: WIDTH,
        height
      };
    });
  }
);
