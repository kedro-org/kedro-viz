import getFormattedNodes, {
  getNodeIDs,
  highlightMatch,
  nodeMatchesSearch
} from './filter-nodes';
import { mockState } from '../../utils/state.mock';
import { getGroupedNodes } from '../../selectors/nodes';

const ungroupNodes = groupedNodes =>
  Object.keys(groupedNodes).reduce(
    (names, key) => names.concat(groupedNodes[key]),
    []
  );

describe('filter-nodes', () => {
  describe('getFormattedNodes', () => {
    const nodes = getGroupedNodes(mockState.lorem);
    const searchTerm = 'e';
    const { formattedNodes, nodeIDs } = getFormattedNodes(nodes, searchTerm);
    const nodeList = ungroupNodes(formattedNodes);

    describe('formattedNodes', () => {
      test.each(nodeList.map(node => node.name))(
        `node name "%s" contains search term "${searchTerm}"`,
        name => {
          expect(name).toEqual(expect.stringMatching(searchTerm));
        }
      );

      test.each(nodeList.map(node => node.highlightedLabel))(
        `node label "%s" contains highlighted search term "<b>${searchTerm}</b>"`,
        name => {
          expect(name).toEqual(expect.stringMatching(`<b>${searchTerm}</b>`));
        }
      );
    });

    describe('nodeIDs', () => {
      test.each(nodeIDs)(
        `node ID "%s" contains search term "${searchTerm}"`,
        nodeID => {
          expect(nodeID).toEqual(expect.stringMatching(searchTerm));
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
    const nodes = getGroupedNodes(mockState.lorem);
    const searchTerm = 'e';
    const formattedNodes = highlightMatch(nodes, searchTerm);
    const nodeList = ungroupNodes(formattedNodes);

    describe(`nodes which match the search term "${searchTerm}"`, () => {
      const matchingNodeList = nodeList.filter(node =>
        node.name.includes(searchTerm)
      );
      test.each(matchingNodeList.map(node => node.highlightedLabel))(
        `node label "%s" contains highlighted search term "<b>${searchTerm}</b>"`,
        name => {
          expect(name).toEqual(expect.stringMatching(`<b>${searchTerm}</b>`));
        }
      );
    });

    describe(`nodes which do not match the search term "${searchTerm}"`, () => {
      const notMatchingNodeList = nodeList.filter(
        node => !node.name.includes(searchTerm)
      );
      test.each(notMatchingNodeList.map(node => node.highlightedLabel))(
        `node label "%s" does not contain "<b>"`,
        name => {
          expect(name).not.toEqual(expect.stringMatching(`<b>`));
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
});
