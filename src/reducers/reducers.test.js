import animals from '../utils/data/animals.mock';
import loremIpsum from '../utils/data/lorem-ipsum.mock';
import { mockState } from '../utils/state.mock';
import reducer from './index';
import * as action from '../actions';
import normalizeData from '../store/normalize-data';

describe('Reducer', () => {
  it('should return an Object', () => {
    expect(reducer(undefined, {})).toEqual(expect.any(Object));
  });

  describe('RESET_DATA', () => {
    it('should return the same data when given the same input', () => {
      expect(
        reducer(mockState.lorem, {
          type: action.RESET_DATA,
          data: normalizeData(loremIpsum)
        })
      ).toEqual(mockState.lorem);
    });

    it('should reset the state with new data', () => {
      const newState = reducer(mockState.lorem, {
        type: action.RESET_DATA,
        data: normalizeData(animals)
      });
      expect(newState).toEqual(mockState.animals);
    });
  });

  describe('TOGGLE_NODE_CLICKED', () => {
    it('should toggle the given node active', () => {
      const nodeClicked = 'abc123';
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_NODE_CLICKED,
        nodeClicked
      });
      expect(newState.node.clicked).toEqual(nodeClicked);
    });
  });

  describe('TOGGLE_NODE_HOVERED', () => {
    it('should toggle the given node active', () => {
      const nodeHovered = 'abc123';
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_NODE_HOVERED,
        nodeHovered
      });
      expect(newState.node.hovered).toEqual(nodeHovered);
    });
  });

  describe('TOGGLE_NODES_DISABLED', () => {
    it('should toggle the given nodes disabled', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_NODES_DISABLED,
        nodeIDs: ['123', 'abc'],
        isDisabled: true
      });
      expect(newState.node.disabled).toEqual({ '123': true, abc: true });
    });
  });

  describe('TOGGLE_TEXT_LABELS', () => {
    it('should toggle the value of textLabels', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_TEXT_LABELS,
        textLabels: true
      });
      expect(mockState.lorem.textLabels).toBe(true);
      expect(newState.textLabels).toBe(true);
    });
  });

  describe('TOGGLE_TAG_ACTIVE', () => {
    it('should toggle the given tag active', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_TAG_ACTIVE,
        tagID: 'huge',
        active: true
      });
      expect(newState.tag.active).toEqual({ huge: true });
    });
  });

  describe('TOGGLE_TAG_FILTER', () => {
    it('should disable a given tag', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_TAG_FILTER,
        tagID: 'small',
        enabled: true
      });
      expect(newState.tag.enabled).toEqual({ small: true });
    });
  });

  describe('TOGGLE_THEME', () => {
    it('should toggle the theme to light', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_THEME,
        theme: 'light'
      });
      expect(newState.theme).toBe('light');
    });
  });

  describe('TOGGLE_TYPE_DISABLED', () => {
    it('should toggle whether a type is disabled', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_TYPE_DISABLED,
        typeID: '123',
        disabled: true
      });
      expect(newState.nodeType.disabled).toEqual({ 123: true });
    });
  });

  describe('UPDATE_CHART_SIZE', () => {
    it("should update the chart's dimensions", () => {
      const newState = reducer(mockState.lorem, {
        type: action.UPDATE_CHART_SIZE,
        chartSize: document.body.getBoundingClientRect()
      });
      expect(newState.chartSize).toEqual({
        bottom: expect.any(Number),
        height: expect.any(Number),
        left: expect.any(Number),
        right: expect.any(Number),
        top: expect.any(Number),
        width: expect.any(Number)
      });
    });
  });

  describe('UPDATE_FONT_LOADED', () => {
    it('should update the state when the webfont is loaded', () => {
      const newState = reducer(mockState.lorem, {
        type: action.UPDATE_FONT_LOADED,
        fontLoaded: true
      });
      expect(newState.fontLoaded).toBe(true);
    });
  });
});
