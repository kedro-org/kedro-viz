import { mockState } from '../utils/state.mock';
import { getPipelineNodeIDs } from './pipeline';
import {
  getNodeActive,
  getNodeSelected,
  getNodeData,
  getGroupedNodes,
  getNodeTextWidth,
  getPadding,
  getNodeSize,
  getVisibleNodes,
  getNodesWithInputParams,
} from './nodes';
import { toggleTextLabels, updateFontLoaded } from '../actions';
import { toggleTypeDisabled } from '../actions/node-type';
import { updateActivePipeline } from '../actions/pipelines';
import {
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodesDisabled,
} from '../actions/nodes';
import reducer from '../reducers';
import { getVisibleNodeIDs } from './disabled';

const getNodeIDs = (state) => state.node.ids;
const getNodeName = (state) => state.node.name;
const getNodeType = (state) => state.node.type;
const getNodePipelines = (state) => state.node.pipelines;

const noFontState = reducer(mockState.animals, updateFontLoaded(false));
const parameterNodesID = ['443cf06a', '2ce32881'];

describe('Selectors', () => {
  describe('getNodeActive', () => {
    const nodeActive = getNodeActive(mockState.animals);

    it('returns an object', () => {
      expect(nodeActive).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(nodeActive)).toEqual(getNodeIDs(mockState.animals));
    });

    it('returns an object whose values are all Booleans', () => {
      expect(Object.values(nodeActive)).toEqual(
        expect.arrayContaining([expect.any(Boolean)])
      );
    });

    it('returns true when a given node is hovered', () => {
      const nodes = getNodeIDs(mockState.animals);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter((id) => id !== nodeID);
      const newMockState = reducer(
        mockState.animals,
        toggleNodeHovered(nodeID)
      );
      const nodeActive = getNodeActive(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every((id) => nodeActive[id] === false)).toEqual(
        true
      );
    });
  });

  describe('getNodeSelected', () => {
    const nodeSelected = getNodeSelected(mockState.animals);

    it('returns an object', () => {
      expect(nodeSelected).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(nodeSelected)).toEqual(getNodeIDs(mockState.animals));
    });

    it('returns an object whose values are all Booleans', () => {
      expect(Object.values(nodeSelected)).toEqual(
        expect.arrayContaining([expect.any(Boolean)])
      );
    });

    it('returns true when a given node is clicked', () => {
      const nodes = getNodeIDs(mockState.animals);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter((id) => id !== nodeID);
      const newMockState = reducer(
        mockState.animals,
        toggleNodeClicked(nodeID)
      );
      const nodeActive = getNodeSelected(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every((id) => nodeActive[id] === false)).toEqual(
        true
      );
    });
  });

  describe('getNodeData', () => {
    it('returns formatted nodes as an array', () => {
      expect(getNodeData(mockState.animals)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.stringMatching(/data|task/),
            disabled: expect.any(Boolean),
            disabled_node: expect.any(Boolean),
            disabled_tag: expect.any(Boolean),
          }),
        ])
      );
    });

    it('returns nodes sorted by name', () => {
      const nodeName = getNodeName(mockState.animals);
      const nodeIDs = getNodeData(mockState.animals).map((d) => d.id);
      const visibleNodeIDs = getNodeIDs(mockState.animals).sort((a, b) => {
        if (nodeName[a] < nodeName[b]) {
          return -1;
        }
        if (nodeName[a] > nodeName[b]) {
          return 1;
        }
        return 0;
      });
      expect(nodeIDs).toEqual(visibleNodeIDs);
    });

    describe(`includes all nodes in the active pipeline`, () => {
      const activePipeline = mockState.animals.pipeline.ids[1];
      const state = reducer(
        mockState.animals,
        updateActivePipeline(activePipeline)
      );
      const nodeDataIDs = getNodeData(state).map((d) => d.id);
      const nodePipelines = getNodePipelines(state);
      const activePipelineNodeIDs = getNodeIDs(state).filter(
        (nodeID) => nodePipelines[nodeID][activePipeline]
      );
      test.each(activePipelineNodeIDs)(
        `node %s is included in nodeData`,
        (nodeID) => {
          expect(nodeDataIDs).toContain(nodeID);
        }
      );
    });

    describe(`does not include any nodes that are not in the active pipeline`, () => {
      const activePipeline = mockState.animals.pipeline.ids[1];
      const state = reducer(
        mockState.animals,
        updateActivePipeline(activePipeline)
      );
      const nodeIDs = getNodeData(state).map((d) => d.id);
      const nodePipelines = getNodePipelines(state);
      test.each(nodeIDs)(
        `node %s is in active pipeline ${activePipeline}`,
        (nodeID) => {
          const nodeIsInActivePipeline = nodePipelines[nodeID][activePipeline];
          expect(nodeIsInActivePipeline).toBe(true);
        }
      );
    });
  });

  describe('getGroupedNodes', () => {
    const groupedNodes = getGroupedNodes(mockState.animals);
    const types = mockState.animals.nodeType.ids.sort();
    const nodeIDs = getPipelineNodeIDs(mockState.animals);
    const nodeType = getNodeType(mockState.animals);

    it('returns nodes grouped by type ID', () => {
      expect(Object.keys(groupedNodes)).toEqual(types);
    });

    test.each(types)(
      'returns all nodes in the active pipeline for "%s" type',
      (type) => {
        const typeNodes = Object.values(groupedNodes[type]);
        const typeNodeIDs = nodeIDs.filter(
          (nodeID) => nodeType[nodeID] === type
        );
        expect(typeNodes.map((d) => d.id)).toEqual(typeNodeIDs);
      }
    );
  });

  describe('getNodeTextWidth', () => {
    describe('when fonts have not yet loaded', () => {
      it('returns an empty object', () => {
        expect(getNodeTextWidth(noFontState)).toEqual({});
      });
    });

    describe('when fonts have loaded', () => {
      const nodeTextWidth = getNodeTextWidth(mockState.animals);
      const values = Object.values(nodeTextWidth);

      it('returns an object', () => {
        expect(nodeTextWidth).toEqual(expect.objectContaining({}));
      });

      it('returns an object with nodeIDs for keys', () => {
        const keys = Object.keys(nodeTextWidth);
        expect(keys.sort()).toEqual(getNodeIDs(mockState.animals).sort());
      });

      it('returns an object whose values are all numbers', () => {
        expect(values.length).toEqual(getNodeIDs(mockState.animals).length);
        expect(values.every((value) => typeof value === 'number')).toBe(true);
      });

      it('returns width=0 if svg getBBox is not supported', () => {
        expect(values.every((value) => value === 0)).toBe(true);
      });
    });
  });

  describe('getPadding', () => {
    it('returns an object with numerical x and y properties', () => {
      expect(getPadding()).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });

    describe('if text labels are enabled', () => {
      it('returns x=16 & y=10 for task icons', () => {
        expect(getPadding(true, true)).toEqual({ x: 16, y: 10 });
      });

      it('returns x=20 & y=10 for database icons', () => {
        expect(getPadding(true, false)).toEqual({ x: 20, y: 10 });
      });
    });

    describe('if text labels are disabled', () => {
      it('returns x=14 & y=14 for task icons', () => {
        expect(getPadding(false, true)).toEqual({ x: 14, y: 14 });
      });

      it('returns x=16 & y=16 for database icons', () => {
        expect(getPadding(false, false)).toEqual({ x: 16, y: 16 });
      });
    });
  });

  describe('getNodeSize', () => {
    describe('when fonts have not yet loaded', () => {
      it('returns an empty object', () => {
        expect(getNodeSize(noFontState)).toEqual({});
      });
    });

    describe('when fonts have loaded', () => {
      it('returns an object containing objects with numerical properties', () => {
        expect(getNodeSize(mockState.animals)).toEqual(expect.any(Object));
        expect(Object.values(getNodeSize(mockState.animals))).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              showText: expect.any(Boolean),
              width: expect.any(Number),
              height: expect.any(Number),
              textOffset: expect.any(Number),
              iconOffset: expect.any(Number),
              iconSize: expect.any(Number),
            }),
          ])
        );
      });

      it('erases the generated SVG node', () => {
        getNodeSize(mockState.animals);
        const svg = document.querySelectorAll('svg');
        expect(svg.length).toEqual(0);
      });

      describe('when text labels are disabled', () => {
        const newMockState = reducer(
          mockState.animals,
          toggleTextLabels(false)
        );

        it('returns identical width and height', () => {
          const node0 = Object.values(getNodeSize(newMockState))[0];
          expect(node0.width).toBe(node0.height);
        });

        it('returns an iconOffset equal to iconSize/-2', () => {
          const node0 = Object.values(getNodeSize(newMockState))[0];
          expect(node0.iconOffset).toBe(node0.iconSize / -2);
        });
      });

      describe('when text labels are enabled', () => {
        const newMockState = reducer(mockState.animals, toggleTextLabels(true));

        it('returns a width greater than the height', () => {
          const node0 = Object.values(getNodeSize(newMockState))[0];
          expect(node0.width).toBeGreaterThan(node0.height);
        });

        it('returns an iconOffset with a greater magnitude than iconSize / 2', () => {
          const node0 = Object.values(getNodeSize(newMockState))[0];
          expect(Math.abs(node0.iconOffset)).toBeGreaterThan(
            Math.abs(node0.iconSize / 2)
          );
        });
      });
    });
  });

  describe('getVisibleNodes', () => {
    describe('when fonts have not yet loaded', () => {
      it('returns an empty array', () => {
        expect(getVisibleNodes(noFontState)).toEqual([]);
      });
    });

    describe('when fonts have loaded', () => {
      it('returns visible nodes as an array', () => {
        expect(getVisibleNodes(mockState.animals)).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              fullName: expect.any(String),
              label: expect.any(String),
              type: expect.any(String),
              width: expect.any(Number),
              height: expect.any(Number),
              textOffset: expect.any(Number),
              iconOffset: expect.any(Number),
              iconSize: expect.any(Number),
            }),
          ])
        );
      });

      it('returns only visible nodes', () => {
        const nodes = getVisibleNodeIDs(mockState.animals);
        const nodeID = nodes[0];
        const newMockState = reducer(
          mockState.animals,
          toggleNodesDisabled([nodeID], true)
        );
        const visibleNodeIDs = getVisibleNodes(newMockState).map((d) => d.id);
        expect(visibleNodeIDs.sort()).toEqual(
          nodes.filter((id) => id !== nodeID).sort()
        );
        expect(visibleNodeIDs.includes(nodeID)).toEqual(false);
      });
    });
  });
  describe('getNodesWithInputParams', () => {
    const newMockState = reducer(
      mockState.animals,
      toggleTypeDisabled('parameters', true)
    );
    const nodesWithInputParams = getNodesWithInputParams(newMockState);
    it('returns an object', () => {
      expect(nodesWithInputParams).toEqual(expect.any(Object));
    });

    it('returns an object with nodes that have parameters as inputs', () => {
      expect(Object.keys(nodesWithInputParams)).toEqual(parameterNodesID);
    });
  });
});
