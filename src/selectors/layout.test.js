import { mockState, prepareState } from '../utils/state.mock';
import {
  getChartSize,
  getSidebarWidth,
  getGraphInput,
  getTriggerLargeGraphWarning,
} from './layout';
import {
  changeFlag,
  toggleIgnoreLargeWarning,
  updateFontLoaded,
} from '../actions';
import { updateGraph } from '../actions/graph';
import { toggleTypeDisabled } from '../actions/node-type';
import reducer from '../reducers';
import { graphNew, graphDagre } from '../utils/graph';
import { sidebarWidth, largeGraphThreshold } from '../config';
import animals from '../utils/data/animals.mock.json';

describe('Selectors', () => {
  describe('getTriggerLargeGraphWarning', () => {
    // Prepare excessively-large dataset
    const prepareLargeDataset = () => {
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
      return data;
    };

    it('returns false for a small dataset', () => {
      expect(getTriggerLargeGraphWarning(mockState.animals)).toEqual(false);
    });

    it('returns true for a large dataset', () => {
      const state = prepareState({ data: prepareLargeDataset() });
      expect(getTriggerLargeGraphWarning(state)).toEqual(true);
    });

    it('returns false if the sizewarning flag is false', () => {
      const state = reducer(
        prepareState({ data: prepareLargeDataset() }),
        changeFlag('sizewarning', false)
      );
      expect(getTriggerLargeGraphWarning(state)).toEqual(false);
    });

    it('returns false if ignoreLargeWarning is true', () => {
      const state = reducer(
        prepareState({ data: prepareLargeDataset() }),
        toggleIgnoreLargeWarning(true)
      );
      expect(getTriggerLargeGraphWarning(state)).toEqual(false);
    });

    it('returns false if layout has already been calculated', () => {
      const actions = [
        // Filter out all data nodes to reduce node-count below threshold
        () => toggleTypeDisabled('data', true),
        // Run layout to update state.graph
        (state) => {
          const layout = state.flags.oldgraph ? graphDagre : graphNew;
          return updateGraph(layout(getGraphInput(state)));
        },
        // Turn the filter back off
        () => toggleTypeDisabled('data', false),
      ];
      const state = actions.reduce(
        (state, action) => reducer(state, action(state)),
        prepareState({ data: prepareLargeDataset() })
      );
      expect(getTriggerLargeGraphWarning(state)).toBe(false);
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
