import { mockState } from '../utils/state.mock';
import {
  getNodeActive,
  getNodeSelected,
  getNodeData,
  getNodeTextWidth,
  getPadding,
  getNodeSize,
  getVisibleNodes
} from './nodes';
import { toggleTextLabels, updateFontLoaded } from '../actions';
import {
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodesDisabled
} from '../actions/nodes';
import reducer from '../reducers';

const getNodeIDs = state => state.node.ids;
const getNodeName = state => state.node.name;

const noFontState = reducer(mockState.lorem, updateFontLoaded(false));

describe('Selectors', () => {
  describe('getNodeActive', () => {
    const nodeActive = getNodeActive(mockState.lorem);

    it('returns an object', () => {
      expect(nodeActive).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(nodeActive)).toEqual(getNodeIDs(mockState.lorem));
    });

    it('returns an object whose values are all Booleans', () => {
      expect(Object.values(nodeActive)).toEqual(
        expect.arrayContaining([expect.any(Boolean)])
      );
    });

    it('returns true when a given node is hovered', () => {
      const nodes = getNodeIDs(mockState.lorem);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter(id => id !== nodeID);
      const newMockState = reducer(mockState.lorem, toggleNodeHovered(nodeID));
      const nodeActive = getNodeActive(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every(id => nodeActive[id] === false)).toEqual(true);
    });
  });

  describe('getNodeSelected', () => {
    const nodeSelected = getNodeSelected(mockState.lorem);

    it('returns an object', () => {
      expect(nodeSelected).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(nodeSelected)).toEqual(getNodeIDs(mockState.lorem));
    });

    it('returns an object whose values are all Booleans', () => {
      expect(Object.values(nodeSelected)).toEqual(
        expect.arrayContaining([expect.any(Boolean)])
      );
    });

    it('returns true when a given node is clicked', () => {
      const nodes = getNodeIDs(mockState.lorem);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter(id => id !== nodeID);
      const newMockState = reducer(mockState.lorem, toggleNodeClicked(nodeID));
      const nodeActive = getNodeSelected(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every(id => nodeActive[id] === false)).toEqual(true);
    });
  });

  describe('getNodeData', () => {
    it('returns formatted nodes as an array', () => {
      expect(getNodeData(mockState.lorem)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.stringMatching(/data|task/),
            disabled: expect.any(Boolean),
            disabled_node: expect.any(Boolean),
            disabled_tag: expect.any(Boolean)
          })
        ])
      );
    });

    it('returns nodes sorted by name', () => {
      const nodeName = getNodeName(mockState.lorem);
      const nodeIDs = getNodeData(mockState.lorem).map(d => d.id);
      const visibleNodeIDs = getNodeIDs(mockState.lorem).sort((a, b) => {
        if (nodeName[a] < nodeName[b]) return -1;
        if (nodeName[a] > nodeName[b]) return 1;
        return 0;
      });
      expect(nodeIDs).toEqual(visibleNodeIDs);
    });
  });

  describe('getNodeTextWidth', () => {
    describe('when fonts have not yet loaded', () => {
      it('returns an empty object', () => {
        expect(getNodeTextWidth(noFontState)).toEqual({});
      });
    });

    describe('when fonts have loaded', () => {
      const nodeTextWidth = getNodeTextWidth(mockState.lorem);
      const values = Object.values(nodeTextWidth);

      it('returns an object', () => {
        expect(nodeTextWidth).toEqual(expect.objectContaining({}));
      });

      it('returns an object with nodeIDs for keys', () => {
        const keys = Object.keys(nodeTextWidth);
        expect(keys.sort()).toEqual(getNodeIDs(mockState.lorem).sort());
      });

      it('returns an object whose values are all numbers', () => {
        expect(values.length).toEqual(getNodeIDs(mockState.lorem).length);
        expect(values.every(value => typeof value === 'number')).toBe(true);
      });

      it('returns width=0 if svg getBBox is not supported', () => {
        expect(values.every(value => value === 0)).toBe(true);
      });
    });
  });

  describe('getPadding', () => {
    it('returns an object with numerical x and y properties', () => {
      expect(getPadding()).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
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
      it('returns x=16 & y=10 for task icons', () => {
        expect(getPadding(false, true)).toEqual({ x: 14, y: 14 });
      });

      it('returns x=20 & y=10 for database icons', () => {
        expect(getPadding(false, false)).toEqual({ x: 16, y: 16 });
      });

      it('returns identical x & y values', () => {
        expect(getPadding(false, true).x).toBe(getPadding(false, true).y);
        expect(getPadding(false, false).x).toBe(getPadding(false, false).y);
      });

      it('returns smaller padding values for task icons than database icons', () => {
        expect(getPadding(false, true).x).toBeLessThan(
          getPadding(false, false).x
        );
        expect(getPadding(false, true).y).toBeLessThan(
          getPadding(false, false).y
        );
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
        expect(getNodeSize(mockState.lorem)).toEqual(expect.any(Object));
        expect(Object.values(getNodeSize(mockState.lorem))).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
              textOffset: expect.any(Number),
              iconOffset: expect.any(Number),
              iconSize: expect.any(Number)
            })
          ])
        );
      });

      it('erases the generated SVG node', () => {
        getNodeSize(mockState.lorem);
        const svg = document.querySelectorAll('svg');
        expect(svg.length).toEqual(0);
      });

      describe('when text labels are disabled', () => {
        const newMockState = reducer(mockState.lorem, toggleTextLabels(false));

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
        const newMockState = reducer(mockState.lorem, toggleTextLabels(true));

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
        expect(getVisibleNodes(mockState.lorem)).toEqual(
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
              iconSize: expect.any(Number)
            })
          ])
        );
      });

      it('returns only visible nodes', () => {
        const nodes = getNodeIDs(mockState.lorem);
        const nodeID = nodes[0];
        const newMockState = reducer(
          mockState.lorem,
          toggleNodesDisabled([nodeID], true)
        );
        const visibleNodeIDs = getVisibleNodes(newMockState).map(d => d.id);
        expect(visibleNodeIDs).toEqual(nodes.filter(id => id !== nodeID));
        expect(visibleNodeIDs.includes(nodeID)).toEqual(false);
      });
    });
  });
});
