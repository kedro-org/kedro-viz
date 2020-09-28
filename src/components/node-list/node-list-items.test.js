import {
  getFilteredNodes,
  getNodeIDs,
  highlightMatch,
  nodeMatchesSearch,
  filterNodes,
  getFilteredTags,
  getFilteredTagItems,
  getSections,
  getGroups,
  getFilteredItems
} from './node-list-items';
import { mockState } from '../../utils/state.mock';
import { getGroupedNodes } from '../../selectors/nodes';
import { getNodeTypes } from '../../selectors/node-types';
import { getTagData } from '../../selectors/tags';

const ungroupNodes = groupedNodes =>
  Object.keys(groupedNodes).reduce(
    (names, key) => names.concat(groupedNodes[key]),
    []
  );

describe('node-list-selectors', () => {
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

  describe('getFilteredTags', () => {
    const tags = getTagData(mockState.animals);
    const searchValue = 'g';
    const filteredTags = getFilteredTags({ tags, searchValue }).tag;

    it('returns expected number of tags', () => {
      expect(filteredTags.length).not.toBe(tags.length);
      expect(filteredTags).toHaveLength(2);
    });

    test.each(filteredTags.map(tag => tag.name))(
      `tag name "%s" contains search term "${searchValue}"`,
      name => {
        expect(name).toEqual(expect.stringMatching(searchValue));
      }
    );

    test.each(filteredTags.map(tag => tag.highlightedLabel))(
      `tag label "%s" contains highlighted search term "<b>${searchValue}</b>"`,
      name => {
        expect(name).toEqual(expect.stringMatching(`<b>${searchValue}</b>`));
      }
    );
  });

  describe('getFilteredTagItems', () => {
    const tags = getTagData(mockState.animals);
    const searchValue = 'g';
    const filteredTagItems = getFilteredTagItems({
      tags,
      searchValue,
      tagsEnabled: {}
    }).tag;

    const tagItems = expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        highlightedLabel: expect.any(String),
        type: expect.any(String),
        visibleIcon: expect.any(Function),
        invisibleIcon: expect.any(Function),
        active: expect.any(Boolean),
        selected: expect.any(Boolean),
        faded: expect.any(Boolean),
        visible: expect.any(Boolean),
        disabled: expect.any(Boolean),
        unset: expect.any(Boolean),
        checked: expect.any(Boolean)
      })
    ]);

    it('filters expected number of items', () => {
      expect(filteredTagItems.length).not.toBe(tags.length);
      expect(filteredTagItems).toHaveLength(2);
    });

    it('returns items of the correct format', () => {
      expect(filteredTagItems).toEqual(tagItems);
    });

    it('returns items for each tag', () => {
      filteredTagItems.forEach((tagItem, index) => {
        expect(tagItem.name).toEqual(tags[index].name);
        expect(tagItem.id).toEqual(tags[index].id);
      });
    });
  });

  describe('getSections', () => {
    const sections = getSections();

    const section = expect.arrayContaining([
      expect.objectContaining({
        name: expect.any(String),
        types: expect.any(Array)
      })
    ]);

    it('returns sections of the correct format', () => {
      expect(sections).toEqual(section);
    });
  });

  describe('getFilteredItems', () => {
    const searchValue = 'a';

    const filteredItems = getFilteredItems({
      nodes: getGroupedNodes(mockState.animals),
      tags: getTagData(mockState.animals),
      tagsEnabled: {},
      nodeSelected: {},
      searchValue
    });

    const items = expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        highlightedLabel: expect.any(String),
        type: expect.any(String),
        visibleIcon: expect.any(Function),
        invisibleIcon: expect.any(Function),
        faded: expect.any(Boolean),
        visible: expect.any(Boolean),
        disabled: expect.any(Boolean),
        unset: expect.any(Boolean),
        checked: expect.any(Boolean)
      })
    ]);

    it('filters expected number of items', () => {
      expect(filteredItems.task).toHaveLength(2);
      expect(filteredItems.data).toHaveLength(6);
      expect(filteredItems.parameters).toHaveLength(2);
      expect(filteredItems.tag).toHaveLength(2);
    });

    it('returns items for each type in the correct format', () => {
      expect(filteredItems).toEqual(
        expect.objectContaining({
          task: items,
          data: items,
          parameters: items,
          tag: items
        })
      );
    });
  });

  describe('getGroups', () => {
    const types = getNodeTypes(mockState.animals);
    const items = getFilteredItems({
      nodes: getGroupedNodes(mockState.animals),
      tags: getTagData(mockState.animals),
      tagsEnabled: {},
      nodeSelected: {},
      searchValue: ''
    });

    const groups = getGroups({ types, items });

    const groupType = expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
      type: expect.any(Object),
      visibleIcon: expect.any(Function),
      invisibleIcon: expect.any(Function),
      kind: expect.any(String),
      count: expect.any(Number),
      allUnset: expect.any(Boolean),
      allChecked: expect.any(Boolean),
      checked: expect.any(Boolean)
    });

    it('returns groups for each type in the correct format', () => {
      expect(groups).toEqual(
        expect.objectContaining({
          task: groupType,
          data: groupType,
          parameters: groupType,
          tag: groupType
        })
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
