import animals from '../utils/data/animals.mock.json';
import node_parameters from '../utils/data/node_parameters.mock.json';
import node_task from '../utils/data/node_task.mock.json';
import node_data from '../utils/data/node_data.mock.json';
import { mockState } from '../utils/state.mock';
import reducer from './index';
import normalizeData from '../store/normalize-data';
import {
  CHANGE_FLAG,
  RESET_DATA,
  TOGGLE_LAYERS,
  TOGGLE_SIDEBAR,
  TOGGLE_TEXT_LABELS,
  TOGGLE_THEME,
  UPDATE_CHART_SIZE,
  UPDATE_FONT_LOADED
} from '../actions';
import {
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_NODE_HOVERED,
  ADD_NODE_METADATA
} from '../actions/nodes';
import { TOGGLE_TAG_ACTIVE, TOGGLE_TAG_FILTER } from '../actions/tags';
import { TOGGLE_TYPE_DISABLED } from '../actions/node-type';
import { UPDATE_ACTIVE_PIPELINE } from '../actions/pipelines';

describe('Reducer', () => {
  it('should return an Object', () => {
    expect(reducer(undefined, {})).toEqual(expect.any(Object));
  });

  describe('RESET_DATA', () => {
    it('should return the same data when given the same input', () => {
      expect(
        reducer(mockState.animals, {
          type: RESET_DATA,
          data: normalizeData(animals)
        })
      ).toEqual(mockState.animals);
    });

    it('should reset the state with new data', () => {
      // Exclude graph prop
      const removeGraph = state => {
        const stateCopy = Object.assign({}, state);
        delete stateCopy.graph;
        return stateCopy;
      };
      const newState = reducer(mockState.demo, {
        type: RESET_DATA,
        data: normalizeData(animals)
      });
      expect(removeGraph(newState)).toEqual(removeGraph(mockState.animals));
    });
  });

  describe('TOGGLE_NODE_CLICKED', () => {
    it('should toggle the given node active', () => {
      const nodeClicked = 'abc123';
      const newState = reducer(mockState.animals, {
        type: TOGGLE_NODE_CLICKED,
        nodeClicked
      });
      expect(newState.node.clicked).toEqual(nodeClicked);
    });
  });

  describe('TOGGLE_NODE_HOVERED', () => {
    it('should toggle the given node active', () => {
      const nodeHovered = 'abc123';
      const newState = reducer(mockState.animals, {
        type: TOGGLE_NODE_HOVERED,
        nodeHovered
      });
      expect(newState.node.hovered).toEqual(nodeHovered);
    });
  });

  describe('TOGGLE_NODES_DISABLED', () => {
    it('should toggle the given nodes disabled', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_NODES_DISABLED,
        nodeIDs: ['123', 'abc'],
        isDisabled: true
      });
      expect(newState.node.disabled).toEqual({ '123': true, abc: true });
    });

    it('should set nodeClicked to null if the selected node is being disabled', () => {
      const nodeID = 'abc123';
      const clickNodeAction = {
        type: TOGGLE_NODE_CLICKED,
        nodeClicked: nodeID
      };
      const clickedState = reducer(mockState.animals, clickNodeAction);
      expect(clickedState.node.clicked).toEqual(nodeID);
      const disableNodeAction = {
        type: TOGGLE_NODES_DISABLED,
        nodeIDs: [nodeID],
        isDisabled: true
      };
      const disabledState = reducer(clickedState, disableNodeAction);
      expect(disabledState.node.clicked).toEqual(null);
    });
  });

  describe('TOGGLE_TEXT_LABELS', () => {
    it('should toggle the value of textLabels', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_TEXT_LABELS,
        textLabels: true
      });
      expect(mockState.animals.textLabels).toBe(true);
      expect(newState.textLabels).toBe(true);
    });
  });

  describe('TOGGLE_TAG_ACTIVE', () => {
    it('should toggle the given tag active', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_TAG_ACTIVE,
        tagID: 'huge',
        active: true
      });
      expect(newState.tag.active).toEqual({ huge: true });
    });
  });

  describe('TOGGLE_TAG_FILTER', () => {
    it('should disable a given tag', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_TAG_FILTER,
        tagID: 'small',
        enabled: true
      });
      expect(newState.tag.enabled).toEqual({ small: true });
    });
  });

  describe('TOGGLE_THEME', () => {
    it('should toggle the theme to light', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_THEME,
        theme: 'light'
      });
      expect(newState.theme).toBe('light');
    });
  });

  describe('TOGGLE_TYPE_DISABLED', () => {
    it('should toggle whether a type is disabled', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_TYPE_DISABLED,
        typeID: '123',
        disabled: true
      });
      expect(newState.nodeType.disabled).toEqual({ 123: true });
    });
  });

  describe('TOGGLE_LAYERS', () => {
    it('should toggle whether layers are shown', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_LAYERS,
        visible: false
      });
      expect(newState.layer.visible).toEqual(false);
    });
  });

  describe('TOGGLE_SIDEBAR', () => {
    it('should toggle whether the sidebar is open', () => {
      const newState = reducer(mockState.animals, {
        type: TOGGLE_SIDEBAR,
        visible: false
      });
      expect(newState.visible.sidebar).toEqual(false);
    });
  });

  describe('UPDATE_ACTIVE_PIPELINE', () => {
    const pipeline = 'abc123';
    const nodeClicked = '123';
    const nodeHovered = '456';
    const pipelineAction = { type: UPDATE_ACTIVE_PIPELINE, pipeline };
    const clickAction = { type: TOGGLE_NODE_CLICKED, nodeClicked };
    const hoverAction = { type: TOGGLE_NODE_HOVERED, nodeHovered };
    const oldState = [clickAction, hoverAction].reduce(
      reducer,
      mockState.animals
    );
    const newState = reducer(oldState, pipelineAction);

    it('should update the active pipeline', () => {
      expect(newState.pipeline.active).toEqual(pipeline);
    });

    it('should reset node.clicked and node.hovered', () => {
      expect(oldState.node.clicked).not.toBe(null);
      expect(oldState.node.hovered).not.toBe(null);
      expect(newState.node.clicked).toBe(null);
      expect(newState.node.hovered).toBe(null);
    });
  });

  describe('ADD_NODE_METADATA', () => {
    const nodeId = '123';

    it('should update the right fields in state under node of task type', () => {
      const data = { id: nodeId, data: node_task };
      const loadDataAction = { type: ADD_NODE_METADATA, data };
      const oldState = mockState.json;
      const newState = reducer(oldState, loadDataAction);
      expect(newState.node.code[nodeId]).toEqual(
        node_task.code
      );
      expect(newState.node.codeLocation[nodeId]).toEqual(
        node_task.code_location
      );
      expect(newState.node.docString[nodeId]).toEqual(node_task.docString);
    });

    it('should update the right fields in state under node of parameter type', () => {
      const data = { id: nodeId, data: node_parameters };
      const loadDataAction = { type: ADD_NODE_METADATA, data };
      const oldState = mockState.json;
      const newState = reducer(oldState, loadDataAction);
      expect(newState.node.parameters[nodeId]).toEqual(
        node_parameters.parameters
      );
    });

    it('should update the right fields in state under node of data type', () => {
      const data = { id: nodeId, data: node_data };
      const loadDataAction = { type: ADD_NODE_METADATA, data };
      const oldState = mockState.json;
      const newState = reducer(oldState, loadDataAction);
      expect(newState.node.dataset_location[nodeId]).toEqual(
        node_data.dataset_location
      );
      expect(newState.node.dataset_type[nodeId]).toEqual(
        node_data.dataset_type
      );
    });
  });

  describe('UPDATE_CHART_SIZE', () => {
    it("should update the chart's dimensions", () => {
      const newState = reducer(mockState.animals, {
        type: UPDATE_CHART_SIZE,
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
      const newState = reducer(mockState.animals, {
        type: UPDATE_FONT_LOADED,
        fontLoaded: true
      });
      expect(newState.fontLoaded).toBe(true);
    });
  });

  describe('CHANGE_FLAG', () => {
    it('should update the state when a flag is changed', () => {
      const newState = reducer(mockState.animals, {
        type: CHANGE_FLAG,
        name: 'testFlag',
        value: true
      });
      expect(newState.flags.testFlag).toBe(true);
    });
  });
});
