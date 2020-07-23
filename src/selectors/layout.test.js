import { mockState } from '../utils/state.mock';
import {
  getChartSize,
  getGraphInput,
  getSidebarWidth,
  getZoomPosition
} from './layout';
import { updateChartSize, updateFontLoaded } from '../actions';
import getInitialState from '../store/initial-state';
import reducer from '../reducers';
import { sidebarBreakpoint, sidebarWidth } from '../config';

describe('Selectors', () => {
  describe('getGraphInput', () => {
    it('returns a graph input object', () => {
      expect(getGraphInput(mockState.animals)).toEqual(
        expect.objectContaining({
          nodes: expect.any(Array),
          edges: expect.any(Array),
          layers: expect.any(Array),
          newgraph: expect.any(Boolean),
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

    describe('if sidebar is visible', () => {
      it(`reduces the chart width by ${open} on screens wider than ${sidebarBreakpoint}`, () => {
        expect(getSidebarWidth(true, 1200)).toEqual(open);
        expect(getSidebarWidth(true, 900)).toEqual(open);
      });

      it(`sets sidebar width to ${closed} on screens smaller than ${sidebarBreakpoint}`, () => {
        expect(getSidebarWidth(true, 480)).toEqual(closed);
        expect(getSidebarWidth(true, 320)).toEqual(closed);
      });
    });

    describe('if sidebar is hidden', () => {
      it(`sets sidebar width to ${closed} on screens wider than ${sidebarBreakpoint}`, () => {
        expect(getSidebarWidth(false, 1000)).toEqual(closed);
      });

      it(`sets sidebar width to ${closed} on screens smaller than ${sidebarBreakpoint}`, () => {
        expect(getSidebarWidth(false, 480)).toEqual(closed);
        expect(getSidebarWidth(false, 320)).toEqual(closed);
      });
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
        top: expect.any(Number),
        width: expect.any(Number)
      });
    });
  });

  describe('getZoomPosition', () => {
    const defaultZoom = {
      scale: 1,
      translateX: 0,
      translateY: 0
    };

    it('returns default values if chartSize is unset', () => {
      expect(getZoomPosition(mockState.animals)).toEqual(defaultZoom);
    });

    it('returns default values when no nodes are visible', () => {
      const newMockState = reducer(
        getInitialState({ data: [] }),
        updateChartSize({ width: 100, height: 100 })
      );
      expect(getZoomPosition(newMockState)).toEqual(defaultZoom);
    });

    it('returns the updated chart zoom translation/scale if chartSize is set', () => {
      const newMockState = reducer(
        mockState.animals,
        updateChartSize({ width: 100, height: 100 })
      );
      const newZoomPos = getZoomPosition(newMockState);
      expect(newZoomPos.scale).toEqual(expect.any(Number));
      expect(newZoomPos.translateX).toEqual(expect.any(Number));
      expect(newZoomPos.translateY).toEqual(expect.any(Number));
      expect(newZoomPos).not.toEqual(
        expect.objectContaining({
          scale: 1,
          translateX: 0,
          translateY: 0
        })
      );
    });
  });
});
