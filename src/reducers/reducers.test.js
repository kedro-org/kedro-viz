import animals from '../utils/data/animals.mock';
import loremIpsum from '../utils/data/lorem-ipsum.mock';
import { mockState } from '../utils/state.mock';
import reducer from './index';
import * as action from '../actions';
import formatData from '../utils/format-data';

const getNodes = state => state.nodes;

describe('Reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({});
  });

  describe('CHANGE_VIEW', () => {
    it('should change the view', () => {
      expect(
        reducer(
          { view: 'combined' },
          {
            type: action.CHANGE_VIEW,
            view: 'data'
          }
        )
      ).toEqual({ view: 'data' });
    });
  });

  describe('RESET_DATA', () => {
    it('should return the same data when given the same input', () => {
      expect(
        reducer(mockState.lorem, {
          type: action.RESET_DATA,
          data: formatData(loremIpsum)
        })
      ).toEqual(mockState.lorem);
    });

    it('should reset the state with new data', () => {
      const newState = reducer(mockState.lorem, {
        type: action.RESET_DATA,
        data: formatData(animals)
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
      expect(newState.nodeClicked).toEqual(nodeClicked);
    });
  });

  describe('TOGGLE_NODE_HOVERED', () => {
    it('should toggle the given node active', () => {
      const nodeHovered = 'abc123';
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_NODE_HOVERED,
        nodeHovered
      });
      expect(newState.nodeHovered).toEqual(nodeHovered);
    });
  });

  describe('TOGGLE_NODE_DISABLED', () => {
    it('should toggle the given node disabled', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_NODE_DISABLED,
        nodeID: 'abc456',
        isDisabled: true
      });
      expect(newState.nodeDisabled).toEqual({ abc456: true });
    });
  });

  describe('TOGGLE_NODES_DISABLED', () => {
    it('should toggle the given nodes disabled', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_NODES_DISABLED,
        nodeIDs: ['123', 'abc'],
        isDisabled: true
      });
      expect(newState.nodeDisabled).toEqual({ '123': true, abc: true });
    });
  });

  describe('TOGGLE_PARAMETERS', () => {
    const newState = reducer(mockState.lorem, {
      type: action.TOGGLE_PARAMETERS,
      parameters: false
    });
    const { nodeDisabled, nodeType } = newState;
    const nodes = getNodes(newState);

    it('should disable any nodes where node.type === "parameters"', () => {
      const paramNodes = nodes.filter(node => nodeType[node] === 'parameters');
      expect(paramNodes.every(key => nodeDisabled[key])).toBe(true);
    });

    it('should not disable any nodes where node.type !=== "parameters"', () => {
      const nonParamNodes = nodes.filter(
        node => nodeType[node] !== 'parameters'
      );
      expect(nonParamNodes.every(key => !nodeDisabled[key])).toBe(true);
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
      expect(newState.tagActive).toEqual({ huge: true });
    });
  });

  describe('TOGGLE_TAG_FILTER', () => {
    it('should disable a given tag', () => {
      const newState = reducer(mockState.lorem, {
        type: action.TOGGLE_TAG_FILTER,
        tagID: 'small',
        enabled: true
      });
      expect(newState.tagEnabled).toEqual({ small: true });
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
});
