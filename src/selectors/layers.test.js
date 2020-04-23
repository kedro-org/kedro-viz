import { mockState } from '../utils/state.mock';
import { getLayers } from './layers';
import { getLayoutNodes } from './layout';

describe('Selectors', () => {
  describe('getLayers', () => {
    it('returns an array', () => {
      expect(getLayers(mockState.layers)).toEqual(expect.any(Array));
    });

    it("returns an array whose IDs match the current pipeline's layer IDs, in the same order", () => {
      expect(getLayers(mockState.layers).map(d => d.id)).toEqual(
        mockState.layers.layer.ids
      );
    });

    it('returns numeric y/height properties for each layer object', () => {
      expect(getLayers(mockState.layers)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            y: expect.any(Number),
            height: expect.any(Number)
          })
        ])
      );
    });

    it("calculates appropriate y/height positions for each layer corresponding to each layer's nodes", () => {
      const nodes = getLayoutNodes(mockState.layers);
      const layers = getLayers(mockState.layers);
      const layerIDs = layers.map(layer => layer.id);
      const layersObj = layers.reduce((layers, layer) => {
        layers[layer.id] = layer;
        return layers;
      }, {});

      expect(
        nodes.every(node => {
          // we don't need to check y/height positions if the layer isn't there.
          if (node.layer === null) {
            return true;
          }
          const i = layerIDs.indexOf(node.layer);
          const prevLayer = layersObj[layerIDs[i - 1]];
          const thisLayer = layersObj[node.layer];
          const nextLayer = layersObj[layerIDs[i + 1]];
          return (
            (!prevLayer || node.y > prevLayer.y + prevLayer.height) &&
            node.y > thisLayer.y &&
            node.y + node.height < thisLayer.y + thisLayer.height &&
            (!nextLayer || node.y + node.height < nextLayer.y)
          );
        })
      ).toBe(true);
    });
  });
});
