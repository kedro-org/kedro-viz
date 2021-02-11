import { mockState } from '../utils/state.mock';
import { getLayers } from './layers';

describe('Selectors', () => {
  describe('getLayers', () => {
    it('returns an array', () => {
      expect(getLayers(mockState.animals)).toEqual(expect.any(Array));
    });

    it("returns an array whose IDs match the current pipeline's layer IDs, in the same order", () => {
      expect(getLayers(mockState.animals).map((d) => d.id)).toEqual(
        mockState.animals.layer.ids
      );
    });

    it('returns numeric y/height properties for each layer object', () => {
      expect(getLayers(mockState.animals)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            y: expect.any(Number),
            height: expect.any(Number),
          }),
        ])
      );
    });

    it("calculates appropriate y/height positions for each layer corresponding to each layer's nodes", () => {
      const { nodes } = mockState.animals.graph;
      const layers = getLayers(mockState.animals);
      const layerIDs = layers.map((layer) => layer.id);
      const layersObj = layers.reduce((layers, layer) => {
        layers[layer.id] = layer;
        return layers;
      }, {});

      nodes.forEach((node) => {
        // We don't need to check y/height positions if the layer field isn't there( this is the case for 'task' type nodes ).
        if (node.layer === null || typeof node.layer === 'undefined') {
          return;
        }

        const i = layerIDs.indexOf(node.layer);
        const prevLayer = layersObj[layerIDs[i - 1]];
        const thisLayer = layersObj[node.layer];
        const nextLayer = layersObj[layerIDs[i + 1]];

        if (prevLayer) {
          expect(node.y).toBeGreaterThanOrEqual(prevLayer.y + prevLayer.height);
        }

        expect(node.y).toBeGreaterThanOrEqual(thisLayer.y);
        expect(node.y + node.height).toBeLessThanOrEqual(
          thisLayer.y + thisLayer.height
        );

        if (nextLayer) {
          expect(node.y + node.height).toBeLessThanOrEqual(nextLayer.y);
        }
      });
    });
  });
});
