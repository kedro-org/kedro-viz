import { mockState, prepareState } from '../utils/state.mock';
import {
  getChartSize,
  getSidebarWidth,
  getGraphInput,
  getTriggerLargeGraphWarning,
} from './layout';
import { updateFontLoaded } from '../actions';
import reducer from '../reducers';
import { sidebarWidth, largeGraphThreshold } from '../config';
import animals from '../utils/data/animals.mock.json';

describe('Selectors', () => {
  describe('getTriggerLargeGraphWarning', () => {
    it('returns false for the animals dataset', () => {
      expect(getTriggerLargeGraphWarning(mockState.animals)).toEqual(false);
    });
    it('returns true for a large dataset', () => {
      const data = { ...animals };
      let extraNodes = [];
      const iterations = Math.ceil(largeGraphThreshold / data.nodes.length) + 1;
      new Array(iterations).fill().forEach((d, i) => {
        const extraNodeGroup = data.nodes.map((node) => ({
          ...node,
          id: node.id + i,
        }));
        extraNodes = extraNodes.concat(extraNodeGroup);
      });
      data.nodes = data.nodes.concat(extraNodes);
      const customMockState = prepareState({ data });
      expect(getTriggerLargeGraphWarning(customMockState)).toEqual(true);
    });
  });

  describe('getGraphInput', () => {
    it('returns a graph input object', () => {
      expect(getGraphInput(mockState.animals)).toEqual(
        expect.objectContaining({
          nodes: expect.any(Array),
          edges: expect.any(Array),
          layers: expect.any(Array),
          oldgraph: expect.any(Boolean),
          fontLoaded: expect.any(Boolean),
        })
      );
    });

    it('returns null if fontLoaded is false', () => {
      const newMockState = reducer(mockState.animals, updateFontLoaded(false));
      expect(getGraphInput(newMockState)).toEqual(null);
    });
  });

  describe('getSidebarWidth', () => {
    it(`if visible is true returns the 'open' width`, () => {
      expect(getSidebarWidth(true, sidebarWidth)).toEqual(sidebarWidth.open);
    });

    it(`if visble is false returns the 'closed' width`, () => {
      expect(getSidebarWidth(false, sidebarWidth)).toEqual(sidebarWidth.closed);
    });
  });

  describe('getChartSize', () => {
    it('returns a set of undefined properties if chartSize DOMRect is not supplied', () => {
      expect(getChartSize(mockState.animals)).toEqual({
        height: undefined,
        left: undefined,
        outerHeight: undefined,
        outerWidth: undefined,
        sidebarWidth: undefined,
        top: undefined,
        width: undefined,
      });
    });

    it('returns a DOMRect converted into an Object, with some extra properties', () => {
      const newMockState = {
        ...mockState.animals,
        chartSize: { left: 100, top: 100, width: 1000, height: 1000 },
      };
      expect(getChartSize(newMockState)).toEqual({
        height: expect.any(Number),
        left: expect.any(Number),
        outerHeight: expect.any(Number),
        outerWidth: expect.any(Number),
        sidebarWidth: expect.any(Number),
        metaSidebarWidth: expect.any(Number),
        codeSidebarWidth: expect.any(Number),
        minWidthScale: expect.any(Number),
        top: expect.any(Number),
        width: expect.any(Number),
      });
    });
  });
});
