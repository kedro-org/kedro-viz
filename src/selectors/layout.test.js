import { mockState } from '../utils/state.mock';
import { getChartSize, getSidebarWidth, getGraphInput } from './layout';
import { updateFontLoaded } from '../actions';
import reducer from '../reducers';
import { sidebarWidth } from '../config';

describe('Selectors', () => {
  describe('getGraphInput', () => {
    it('returns a graph input object', () => {
      expect(getGraphInput(mockState.animals)).toEqual(
        expect.objectContaining({
          nodes: expect.any(Array),
          edges: expect.any(Array),
          layers: expect.any(Array),
          oldgraph: expect.any(Boolean),
          fontLoaded: expect.any(Boolean)
        })
      );
    });

    it('returns null if fontLoaded is false', () => {
      const newMockState = reducer(mockState.animals, updateFontLoaded(false));
      expect(getGraphInput(newMockState)).toEqual(null);
    });
  });

  describe('getSidebarWidth', () => {
    const { open, closed } = sidebarWidth;

    it(`if sidebar is visible sets sidebar width to ${open}`, () => {
      expect(getSidebarWidth(true, sidebarWidth)).toEqual(open);
    });

    it(`if sidebar is hidden sets sidebar width to ${closed}`, () => {
      expect(getSidebarWidth(false, sidebarWidth)).toEqual(closed);
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
        width: undefined
      });
    });

    it('returns a DOMRect converted into an Object, with some extra properties', () => {
      const newMockState = {
        ...mockState.animals,
        chartSize: { left: 100, top: 100, width: 1000, height: 1000 }
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
        width: expect.any(Number)
      });
    });
  });
});
