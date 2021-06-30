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
  getFilteredItems,
  getFilteredTreeItems,
  getFilteredNodeModularPipelines,
  getFilteredNodeItems,
  getFilteredModularPipelineParent,
  getFilteredModularPipelineNodes,
  getNestedModularPipelines,
} from './node-list-items';
import { mockState } from '../../utils/state.mock';
import {
  getGroupedNodes,
  getNodeModularPipelines,
} from '../../selectors/nodes';
import { getNodeTypes, getNodeTypeIDs } from '../../selectors/node-types';
import { getTagData } from '../../selectors/tags';
import {
  getModularPipelineData,
  getModularPipelineIDs,
} from '../../selectors/modular-pipelines';

const ungroupNodes = (groupedNodes) =>
  Object.keys(groupedNodes).reduce(
    (names, key) => names.concat(groupedNodes[key]),
    []
  );

describe('node-list-selectors', () => {
  describe('getFilteredNodes', () => {
    const nodes = getGroupedNodes(mockState.animals);
    let searchValue = 'Bear';
    const { filteredNodes } = getFilteredNodes({ nodes, searchValue });
    const nodeList = ungroupNodes(filteredNodes);

    test.each(nodeList.map((node) => node.name))(
      `node name "%s" contains search term "${searchValue}"`,
      (name) => {
        expect(name).toEqual(expect.stringMatching(searchValue));
      }
    );

    test.each(nodeList.map((node) => node.highlightedLabel))(
      `node label "%s" contains highlighted search term "<b>${searchValue}</b>"`,
      (name) => {
        expect(name).toEqual(expect.stringMatching(`<b>${searchValue}</b>`));
      }
    );
  });

  describe('getFilteredTags', () => {
    const tags = getTagData(mockState.animals);
    const searchValue = 'm';
    const filteredTags = getFilteredTags({ tags, searchValue }).tag;

    it('returns expected number of tags', () => {
      expect(filteredTags.length).not.toBe(tags.length);
      expect(filteredTags).toHaveLength(2);
    });

    test.each(filteredTags.map((tag) => tag.name))(
      `tag name "%s" contains search term "${searchValue}"`,
      (name) => {
        expect(name).toEqual(expect.stringMatching(searchValue));
      }
    );

    test.each(filteredTags.map((tag) => tag.highlightedLabel))(
      `tag label "%s" contains highlighted search term "<b>${searchValue}</b>"`,
      (name) => {
        expect(name).toEqual(expect.stringMatching(`<b>${searchValue}</b>`));
      }
    );
  });

  describe('getFilteredTagItems', () => {
    const tags = getTagData(mockState.animals);
    const searchValue = 'm';
    const filteredTagItems = getFilteredTagItems({
      tags,
      searchValue,
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
        checked: expect.any(Boolean),
      }),
    ]);

    it('returns expected items matching the searchValue', () => {
      expect(filteredTagItems.length).not.toBe(tags.length);
      expect(filteredTagItems).toHaveLength(2);

      expect(filteredTagItems[0].name).toEqual('Medium');
      expect(filteredTagItems[0].id).toEqual('medium');
      expect(filteredTagItems[1].name).toEqual('Small');
      expect(filteredTagItems[1].id).toEqual('small');
    });

    it('returns items of the correct format', () => {
      expect(filteredTagItems).toEqual(tagItems);
    });

    it('returns the filtered items that contains the search value', () => {
      filteredTagItems.forEach((tagItem) => {
        expect(tagItem.name).toContain(searchValue);
        expect(tagItem.id).toContain(searchValue);
      });
    });
  });

  describe('getSections', () => {
    const sections = getSections();

    const groupType = expect.objectContaining({
      name: expect.any(String),
      types: expect.any(Array),
    });

    const sectionType = expect.objectContaining({
      Elements: expect.arrayContaining([groupType]),
      Categories: expect.arrayContaining([groupType]),
    });

    it('returns sections of the correct format', () => {
      expect(sections).toEqual(sectionType);
    });
  });

  describe('getFilteredItems', () => {
    const searchValue = 'a';

    const filteredItems = getFilteredItems({
      nodes: getGroupedNodes(mockState.animals),
      tags: getTagData(mockState.animals),
      modularPipelines: getModularPipelineData(mockState.animals),
      nodeSelected: {},
      searchValue,
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
        checked: expect.any(Boolean),
      }),
    ]);

    it('filters expected number of items', () => {
      expect(filteredItems.task).toHaveLength(3);
      expect(filteredItems.data).toHaveLength(10);
      expect(filteredItems.parameters).toHaveLength(4);
      expect(filteredItems.tag).toHaveLength(2);
      expect(filteredItems.modularPipeline).toHaveLength(3);
    });

    it('returns items for each type in the correct format', () => {
      expect(filteredItems).toEqual(
        expect.objectContaining({
          task: items,
          data: items,
          parameters: items,
          tag: items,
        })
      );
    });
  });

  describe('getGroups', () => {
    const types = getNodeTypes(mockState.animals);

    const items = getFilteredItems({
      nodes: getGroupedNodes(mockState.animals),
      tags: getTagData(mockState.animals),
      modularPipelines: getModularPipelineData(mockState.animals),
      nodeSelected: {},
      searchValue: '',
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
      checked: expect.any(Boolean),
    });

    it('returns groups for each type in the correct format', () => {
      expect(groups).toEqual(
        expect.objectContaining({
          task: groupType,
          data: groupType,
          parameters: groupType,
          tag: groupType,
        })
      );
    });
  });

  describe('getNodeIDs', () => {
    const generateNodes = (type, count) =>
      Array.from(new Array(count)).map((d, i) => ({
        id: type + i,
      }));

    const nodes = {
      data: generateNodes('data', 10),
      task: generateNodes('task', 10),
      parameters: generateNodes('parameters', 10),
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
      const matchingNodeList = nodeList.filter((node) =>
        node.name.includes(searchValue)
      );
      test.each(matchingNodeList.map((node) => node.highlightedLabel))(
        `node label "%s" contains highlighted search term "<b>${searchValue}</b>"`,
        (label) => {
          expect(label).toEqual(expect.stringMatching(`<b>${searchValue}</b>`));
        }
      );
    });

    describe(`nodes which do not match the search term "${searchValue}"`, () => {
      const notMatchingNodeList = nodeList.filter(
        (node) => !node.name.includes(searchValue)
      );
      test.each(notMatchingNodeList.map((node) => node.highlightedLabel))(
        `node label "%s" does not contain "<b>"`,
        (label) => {
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
      (node) => !node.name.includes(searchValue)
    );

    describe('nodes which match the search term', () => {
      test.each(nodeList.map((node) => node.name))(
        `node name "%s" should contain search term "${searchValue}"`,
        (name) => {
          expect(name).toEqual(expect.stringMatching(searchValue));
        }
      );
    });

    describe('nodes which do not match the search term', () => {
      test.each(notMatchingNodeList.map((node) => node.id))(
        `filtered node list should not contain a node with id "%s"`,
        (nodeID) => {
          expect(nodeList.map((node) => node.id)).not.toContain(
            expect.stringMatching(searchValue)
          );
        }
      );
    });
  });

  describe('filterModularPipelines', () => {
    const modularPipelines = getModularPipelineData(mockState.animals);
    const searchValue = '2';
    const filteredModularPipelines = filterNodes(
      { modularPipeline: modularPipelines },
      searchValue
    );
    const modularPipelineList = filteredModularPipelines.modularPipeline;
    const notMatchingModularPipelineList = modularPipelines.filter(
      (modularPipeline) => !modularPipeline.name.includes(searchValue)
    );

    describe('nodes which match the search term', () => {
      test.each(
        modularPipelineList.map((modularPipeline) => modularPipeline.name)
      )(
        `modular pipeline name "%s" should contain search term "${searchValue}"`,
        (name) => {
          expect(name).toEqual(expect.stringMatching(searchValue));
        }
      );
    });

    describe('modularPipelines which do not match the search term', () => {
      test.each(
        notMatchingModularPipelineList.map(
          (modularPipeline) => modularPipeline.id
        )
      )(
        `filtered modular pipeline list should not contain a node with id "%s"`,
        (modularPipelineID) => {
          expect(
            modularPipelines.map((modularPipeline) => modularPipeline.id)
          ).not.toContain(expect.stringMatching(searchValue));
        }
      );
    });
  });

  describe('Tree list selectors', () => {
    describe('getFilteredNodeModularPipelines', () => {
      const searchValue = 'Shark';

      const filteredNodeItems = getFilteredNodeItems({
        nodes: getGroupedNodes(mockState.animals),
        tags: getTagData(mockState.animals),
        modularPipelines: getModularPipelineData(mockState.animals),
        nodeSelected: {},
        searchValue,
        modularPipelineIDs: getModularPipelineIDs(mockState.animals),
        nodeModularPipelines: getNodeModularPipelines(mockState.animals),
        nodeTypeIDs: getNodeTypeIDs(mockState.animals),
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
          checked: expect.any(Boolean),
        }),
      ]);

      it('filters expected number of items', () => {
        expect(filteredNodeItems.task).toHaveLength(1);
      });

      it('returns items for each type in the correct format', () => {
        expect(filteredNodeItems).toEqual(
          expect.objectContaining({
            task: items,
            data: [],
            parameters: [],
          })
        );
      });

      const filteredNodeModularPipelines = getFilteredNodeModularPipelines({
        nodes: getGroupedNodes(mockState.animals),
        tags: getTagData(mockState.animals),
        modularPipelines: getModularPipelineData(mockState.animals),
        nodeSelected: {},
        searchValue,
        modularPipelineIDs: getModularPipelineIDs(mockState.animals),
        nodeModularPipelines: getNodeModularPipelines(mockState.animals),
        nodeTypeIDs: getNodeTypeIDs(mockState.animals),
      });

      it('filters expected number of items', () => {
        expect(filteredNodeModularPipelines).toHaveLength(2);
      });
    });

    describe('getFilteredModularPipelineParent', () => {
      const searchValue = 'Data Engineering';

      const filteredModularPipelineParents = getFilteredModularPipelineParent({
        nodes: getGroupedNodes(mockState.animals),
        tags: getTagData(mockState.animals),
        modularPipelines: getModularPipelineData(mockState.animals),
        nodeSelected: {},
        searchValue,
        modularPipelineIDs: getModularPipelineIDs(mockState.animals),
        nodeModularPipelines: getNodeModularPipelines(mockState.animals),
        nodeTypeIDs: getNodeTypeIDs(mockState.animals),
      });

      it('filters expected number of items', () => {
        expect(filteredModularPipelineParents).toHaveLength(1);
      });
    });

    describe('getFilteredTreeItems', () => {
      const searchValue = 'shark';

      const filteredTreeItems = getFilteredTreeItems({
        nodes: getGroupedNodes(mockState.animals),
        tags: getTagData(mockState.animals),
        modularPipelines: getModularPipelineData(mockState.animals),
        nodeSelected: {},
        searchValue,
        modularPipelineIDs: getModularPipelineIDs(mockState.animals),
        nodeModularPipelines: getNodeModularPipelines(mockState.animals),
        nodeTypeIDs: getNodeTypeIDs(mockState.animals),
      });

      it('filters expected number of items', () => {
        expect(filteredTreeItems).toHaveLength(2);
      });
    });

    describe('getFilteredModularPipelineNodes', () => {
      describe('should return an object corresponding to the right amount of modular pipeline items', () => {
        const filteredModularPipelineNodes = getFilteredModularPipelineNodes({
          nodes: getGroupedNodes(mockState.animals),
          tags: getTagData(mockState.animals),
          modularPipelines: getModularPipelineData(mockState.animals),
          nodeSelected: {},
          searchValue: '',
          modularPipelineIds: getModularPipelineIDs(mockState.animals),
          nodeModularPipelines: getNodeModularPipelines(mockState.animals),
          nodeTypeIDs: getNodeTypeIDs(mockState.animals),
        });

        it('filters expected number of items', () => {
          expect(Object.keys(filteredModularPipelineNodes)).toHaveLength(7);
        });
      });

      describe('should return the correct amount of nodes for the filtered modular pipeline', () => {
        const searchValue = 'Nested.weasel';

        const filteredModularPipelineNodes = getFilteredModularPipelineNodes({
          nodes: getGroupedNodes(mockState.animals),
          tags: getTagData(mockState.animals),
          modularPipelines: getModularPipelineData(mockState.animals),
          nodeSelected: {},
          searchValue,
          modularPipelineIds: getModularPipelineIDs(mockState.animals),
          nodeModularPipelines: getNodeModularPipelines(mockState.animals),
          nodeTypeIDs: getNodeTypeIDs(mockState.animals),
        });

        it('filters expected number of items', () => {
          expect(filteredModularPipelineNodes.nested).toHaveLength(1);
        });
      });
    });

    describe('getNestedModularPipelines', () => {
      describe('should return the right amount of nodes and children pipelines by default', () => {
        const searchValue = '';

        const nestedModularPipelines = getNestedModularPipelines({
          nodes: getGroupedNodes(mockState.animals),
          tags: getTagData(mockState.animals),
          modularPipelines: getModularPipelineData(mockState.animals),
          nodeSelected: {},
          searchValue,
          modularPipelineIds: getModularPipelineIDs(mockState.animals),
          nodeModularPipelines: getNodeModularPipelines(mockState.animals),
          nodeTypeIDs: getNodeTypeIDs(mockState.animals),
        });

        it('contains expected number of node and modular pipeline items', () => {
          expect(nestedModularPipelines.nodes).toHaveLength(13);
          expect(nestedModularPipelines.children).toHaveLength(3);
        });
      });

      describe('should return the right amount of nodes and children pipelines', () => {
        const searchValue = 'shark';

        const nestedModularPipelines = getNestedModularPipelines({
          nodes: getGroupedNodes(mockState.animals),
          tags: getTagData(mockState.animals),
          modularPipelines: getModularPipelineData(mockState.animals),
          nodeSelected: {},
          searchValue,
          modularPipelineIds: getModularPipelineIDs(mockState.animals),
          nodeModularPipelines: getNodeModularPipelines(mockState.animals),
          nodeTypeIDs: getNodeTypeIDs(mockState.animals),
        });

        it('contains expected number of node and modular pipeline items for the search value', () => {
          expect(nestedModularPipelines.nodes).toHaveLength(0);
          expect(nestedModularPipelines.children).toHaveLength(1);
        });
      });
    });
  });
});
