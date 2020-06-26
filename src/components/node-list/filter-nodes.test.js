import getFilteredNodes, {
  getNodeIDs,
  highlightMatch,
  nodeMatchesSearch,
  filterNodes
} from './filter-nodes';
import { mockState } from '../../utils/state.mock';
import { getGroupedNodes } from '../../selectors/nodes';

const ungroupNodes = groupedNodes =>
  Object.keys(groupedNodes).reduce(
    (names, key) => names.concat(groupedNodes[key]),
    []
  );

describe('filter-nodes', () => {
  describe('getFilteredNodes', () => {
    const nodes = getGroupedNodes(mockState.animals);
    const searchValue = 'e';
    const { filteredNodes, nodeIDs } = getFilteredNodes({ nodes, searchValue });
    const nodeList = ungroupNodes(filteredNodes);

    describe('filteredNodes', () => {
      test.each(nodeList.map(node => node.name))(
        `node name "%s" contains search term "${searchValue}"`,
        name => {
          expect(name).toEqual(expect.stringMatching(searchValue));
        }
      );

      test.each(nodeList.map(node => node.highlightedLabel))(
        `node label "%s" contains highlighted search term "<b>${searchValue}</b>"`,
        name => {
          expect(name).toEqual(expect.stringMatching(`<b>${searchValue}</b>`));
        }
      );
    });

    describe('nodeIDs', () => {
      test.each(nodeIDs)(
        `node ID "%s" contains search term "${searchValue}"`,
        nodeID => {
          expect(nodeID).toEqual(expect.stringMatching(searchValue));
        }
      );
    });
  });

  describe('getNodeIDs', () => {
    const generateNodes = (type, count) =>
      Array.from(new Array(count)).map((d, i) => ({
        id: type + i
      }));

    const nodes = {
      data: generateNodes('data', 10),
      task: generateNodes('task', 10),
      parameters: generateNodes('parameters', 10)
    };

    it('returns a list of node IDs', () => {
      const nodeIDs = getNodeIDs(nodes);
      expect(nodeIDs).toHaveLength(30);
      expect(nodeIDs).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(nodeIDs).toContain('data0');
      expect(nodeIDs).toContain('task1');
      expect(nodeIDs).toContain('parameters1');
    });
  });

  describe('highlightMatch', () => {
    const nodes = getGroupedNodes(mockState.animals);
    const searchValue = 'e';
    const formattedNodes = highlightMatch(nodes, searchValue);
    const nodeList = ungroupNodes(formattedNodes);

    describe(`nodes which match the search term "${searchValue}"`, () => {
      const matchingNodeList = nodeList.filter(node =>
        node.name.includes(searchValue)
      );
      test.each(matchingNodeList.map(node => node.highlightedLabel))(
        `node label "%s" contains highlighted search term "<b>${searchValue}</b>"`,
        label => {
          expect(label).toEqual(expect.stringMatching(`<b>${searchValue}</b>`));
        }
      );
    });

    describe(`nodes which do not match the search term "${searchValue}"`, () => {
      const notMatchingNodeList = nodeList.filter(
        node => !node.name.includes(searchValue)
      );
      test.each(notMatchingNodeList.map(node => node.highlightedLabel))(
        `node label "%s" does not contain "<b>"`,
        label => {
          expect(label).not.toEqual(expect.stringMatching(`<b>`));
        }
      );
    });
  });

  describe('nodeMatchesSearch', () => {
    const node = { name: 'qwertyuiop' };

    it('returns true if the node name matches the search', () => {
      expect(nodeMatchesSearch(node, 'qwertyuiop')).toBe(true);
      expect(nodeMatchesSearch(node, 'qwe')).toBe(true);
      expect(nodeMatchesSearch(node, 'p')).toBe(true);
    });

    it('returns true if the search is falsey', () => {
      expect(nodeMatchesSearch(node, '')).toBe(true);
      expect(nodeMatchesSearch(node, null)).toBe(true);
      expect(nodeMatchesSearch(node, undefined)).toBe(true);
    });

    it('returns false if the node name does not match the search', () => {
      expect(nodeMatchesSearch(node, 'a')).toBe(false);
      expect(nodeMatchesSearch(node, 'qwe ')).toBe(false);
      expect(nodeMatchesSearch(node, ' ')).toBe(false);
      expect(nodeMatchesSearch(node, '_')).toBe(false);
    });
  });

  describe('filterNodes', () => {
    const nodes = getGroupedNodes(mockState.animals);
    const searchValue = 'a';
    const filteredNodes = filterNodes(nodes, searchValue);
    const nodeList = ungroupNodes(filteredNodes);
    const notMatchingNodeList = ungroupNodes(nodes).filter(
      node => !node.name.includes(searchValue)
    );

    describe('nodes which match the search term', () => {
      test.each(nodeList.map(node => node.name))(
        `node name "%s" should contain search term "${searchValue}"`,
        name => {
          expect(name).toEqual(expect.stringMatching(searchValue));
        }
      );
    });

    describe('nodes which do not match the search term', () => {
      test.each(notMatchingNodeList.map(node => node.id))(
        `filtered node list should not contain a node with id "%s"`,
        nodeID => {
          expect(nodeList.map(node => node.id)).not.toContain(
            expect.stringMatching(searchValue)
          );
        }
      );
    });
  });
});
