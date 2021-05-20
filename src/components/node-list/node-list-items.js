import { createSelector } from 'reselect';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { sidebar } from '../../config';
import IndicatorIcon from '../icons/indicator';
import IndicatorOffIcon from '../icons/indicator-off';
import IndicatorPartialIcon from '../icons/indicator-partial';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import { arrayToObject } from '../../utils';
const { escapeRegExp, getHighlightedText } = utils;

/**
 * Get a list of IDs of the visible nodes
 * @param {object} nodes Grouped nodes
 * @return {array} List of node IDs
 */
export const getNodeIDs = (nodes) => {
  const getNodeIDs = (type) => nodes[type].map((node) => node.id);
  const concatNodeIDs = (nodeIDs, type) => nodeIDs.concat(getNodeIDs(type));

  return Object.keys(nodes).reduce(concatNodeIDs, []);
};

/**
 * Add a new highlightedLabel field to each of the node objects
 * @param {object} nodes Grouped lists of nodes
 * @param {string} searchValue Search term
 * @return {object} The grouped nodes with highlightedLabel fields added
 */
export const highlightMatch = (nodes, searchValue) => {
  const addHighlightedLabel = (node) => ({
    highlightedLabel: getHighlightedText(node.name, searchValue),
    ...node,
  });
  const addLabelsToNodes = (newNodes, type) => ({
    ...newNodes,
    [type]: nodes[type].map(addHighlightedLabel),
  });

  return Object.keys(nodes).reduce(addLabelsToNodes, {});
};

/**
 * Check whether a name matches the search text
 * @param {string} name
 * @param {string} searchValue
 * @return {boolean} True if match
 */
export const nodeMatchesSearch = (node, searchValue) => {
  const valueRegex = searchValue
    ? new RegExp(escapeRegExp(searchValue), 'gi')
    : '';
  return Boolean(node.name.match(valueRegex));
};

/**
 * Return only the results that match the search text
 * @param {object} nodes Grouped lists of nodes
 * @param {string} searchValue Search term
 * @return {object} Grouped nodes
 */
export const filterNodes = (nodes, searchValue) => {
  const filterNodesByType = (type) =>
    nodes[type].filter((node) => nodeMatchesSearch(node, searchValue));
  const filterNodeLists = (newNodes, type) => ({
    ...newNodes,
    [type]: filterNodesByType(type),
  });
  return Object.keys(nodes).reduce(filterNodeLists, {});
};

/**
 * Return filtered/highlighted nodes, and filtered node IDs
 * @param {object} nodes Grouped lists of nodes
 * @param {string} searchValue Search term
 * @return {object} Grouped nodes, and node IDs
 */
export const getFilteredNodes = createSelector(
  [(state) => state.nodes, (state) => state.searchValue],
  (nodes, searchValue) => {
    const filteredNodes = filterNodes(nodes, searchValue);

    return {
      filteredNodes: highlightMatch(filteredNodes, searchValue),
      nodeIDs: getNodeIDs(filteredNodes),
    };
  }
);

/**
 * Return filtered/highlighted tags
 * @param {object} tags List of tags
 * @param {string} searchValue Search term
 * @return {object} Grouped tags
 */
export const getFilteredTags = createSelector(
  [(state) => state.tags, (state) => state.searchValue],
  (tags, searchValue) =>
    highlightMatch(filterNodes({ tag: tags }, searchValue), searchValue)
);

/**
 * Return filtered/highlighted tag list items
 * @param {object} filteredTags List of filtered tags
 * @return {array} Node list items
 */
export const getFilteredTagItems = createSelector(
  getFilteredTags,
  (filteredTags) => ({
    tag: filteredTags.tag.map((tag) => ({
      ...tag,
      type: 'tag',
      visibleIcon: IndicatorIcon,
      invisibleIcon: IndicatorOffIcon,
      active: false,
      selected: false,
      faded: false,
      visible: true,
      disabled: false,
      unset: !tag.enabled,
      checked: tag.enabled,
    })),
  })
);

/**
 * Return filtered/highlighted modular pipelines
 * @param {object} modularPipelines List of modular pipelines
 * @param {string} searchValue Search term
 * @return {object} Grouped modular pipelines
 */
export const getFilteredModularPipelines = createSelector(
  [(state) => state.modularPipelines, (state) => state.searchValue],
  (modularPipelines, searchValue) =>
    highlightMatch(
      filterNodes({ modularPipeline: modularPipelines }, searchValue),
      searchValue
    )
);

/**
 * Return filtered/highlighted modular pipeline list items
 * @param {object} filteredModularPipelines List of filtered modularPipelines
 * @return {array} Node list items
 */
export const getFilteredModularPipelineItems = createSelector(
  getFilteredModularPipelines,
  (filteredModularPipelines) => ({
    modularPipeline: filteredModularPipelines.modularPipeline.map(
      (modularPipeline) => ({
        ...modularPipeline,
        type: 'modularPipeline',
        visibleIcon: IndicatorIcon,
        invisibleIcon: IndicatorOffIcon,
        active: false,
        selected: false,
        faded: false,
        visible: true,
        disabled: false,
        unset: !modularPipeline.enabled,
        checked: modularPipeline.enabled,
      })
    ),
  })
);

/**
 * Compares items for sorting in groups first
 * by enabled status (by tag) and then alphabeticaly (by name)
 * @param {object} itemA First item to compare
 * @param {object} itemB Second item to compare
 * @return {number} Comparison result
 */
const compareEnabledThenAlpha = (itemA, itemB) => {
  const byEnabledTag = Number(itemA.disabled_tag) - Number(itemB.disabled_tag);
  const byAlpha = itemA.name.localeCompare(itemB.name);
  return byEnabledTag !== 0 ? byEnabledTag : byAlpha;
};

/**
 * Compares items for sorting in groups first
 * by enabled status (by tag) and then alphabeticaly (by name)
 * @param {object} itemA First item to compare
 * @param {object} itemB Second item to compare
 * @return {number} Comparison result
 */
export const getFilteredNodeItems = createSelector(
  [getFilteredNodes, (state) => state.nodeSelected],
  ({ filteredNodes }, nodeSelected) => {
    const result = {};

    for (const type of Object.keys(filteredNodes)) {
      result[type] = filteredNodes[type]
        .map((node) => {
          const checked = !node.disabled_node;
          const disabled =
            node.disabled_tag ||
            node.disabled_type ||
            node.disabled_modularPipeline;
          return {
            ...node,
            visibleIcon: VisibleIcon,
            invisibleIcon: InvisibleIcon,
            active: undefined,
            selected: nodeSelected[node.id],
            faded: node.disabled_node || disabled,
            visible: !disabled && checked,
            unset: false,
            checked,
            disabled,
          };
        })
        .sort(compareEnabledThenAlpha);
    }

    return result;
  }
);

/**
 * Get sidebar node-list section config object, with/without modular pipelines
 * @param {boolean} modularPipelineFlag Whether to include modular pipelines
 * @return {object} config
 */
export const getSidebarConfig = createSelector(
  (state) => state.flags.modularpipeline,
  (modularPipelineFlag) => {
    if (modularPipelineFlag) {
      return sidebar;
    }
    const { ModularPipelines, ...Categories } = sidebar.Categories;
    return Object.assign({}, sidebar, { Categories });
  }
);

/**
 * Get formatted list of sections
 * @return {object} Map of arrays of sections
 */
export const getSections = createSelector(getSidebarConfig, (sidebarConfig) => {
  const sections = {};

  for (const key of Object.keys(sidebarConfig)) {
    sections[key] = [
      {
        name: key,
        types: Object.values(sidebarConfig[key]),
      },
    ];
  }

  return sections;
});

/**
 * Create a new group of items. This can be one of two kinds:
 * 'filter': Categories, e.g. tags
 * 'element': Graph elements, e.g. nodes, datasets, or parameters
 * An item is a node-list row, e.g. a node or a tag.
 * @param {object} itemType Meta information about the group's items
 * @param {array} itemsOfType List of items in the group
 */
export const createGroup = (itemType, itemsOfType = []) => {
  const group = {
    type: itemType,
    id: itemType.id,
    count: itemsOfType.length,
    allUnset: itemsOfType.every((item) => item.unset),
    allChecked: itemsOfType.every((item) => item.checked),
  };

  if (itemType.id === 'tag') {
    Object.assign(group, {
      name: 'Tags',
      kind: 'filter',
      checked: !group.allUnset,
      visibleIcon: group.allChecked ? IndicatorIcon : IndicatorPartialIcon,
      invisibleIcon: IndicatorOffIcon,
    });
  } else if (itemType.id === 'modularPipeline') {
    Object.assign(group, {
      name: 'Modular Pipelines',
      kind: 'filter',
      checked: !group.allUnset,
      visibleIcon: group.allChecked ? IndicatorIcon : IndicatorPartialIcon,
      invisibleIcon: IndicatorOffIcon,
    });
  } else {
    Object.assign(group, {
      name: itemType.name,
      kind: 'element',
      checked: !itemType.disabled,
      visibleIcon: VisibleIcon,
      invisibleIcon: InvisibleIcon,
    });
  }
  return group;
};

/**
 * Returns groups of items per type
 * @param {array} types List of node types
 * @param {array} items List of items
 * @return {array} List of groups
 */
export const getGroups = createSelector(
  [(state) => state.types, (state) => state.items],
  (nodeTypes, items) => {
    const groups = {};
    const itemTypes = [...nodeTypes, { id: 'tag' }, { id: 'modularPipeline' }];
    for (const itemType of itemTypes) {
      groups[itemType.id] = createGroup(itemType, items[itemType.id]);
    }
    return groups;
  }
);

/**
 * Returns filtered/highlighted items for nodes, tags and modular pipelines
 * @param {object} filteredNodeItems List of filtered nodes
 * @param {object} filteredTagItems List of filtered tags
 * @param {object} filteredModularPipelinesItems List of filtered modularPipelines
 * @return {array} final list of all filtered items from the three filtered item sets
 */
export const getFilteredItems = createSelector(
  [getFilteredNodeItems, getFilteredTagItems, getFilteredModularPipelineItems],
  (filteredNodeItems, filteredTagItems, filteredModularPipelineItems) => {
    return {
      ...filteredTagItems,
      ...filteredNodeItems,
      ...filteredModularPipelineItems,
    };
  }
);

// these are the selectors needed for the tree list structure

// new filter logic:
// 1. filter the set of nodes by search value
// 2. filter the set of modular pipelines by search value
// 3. go through the set of filtered nodes to append the modular pipeline to the lsit of modular pipelines

// pre-search logic:
// A: top down ( from modular pipeline to nodes)
// B. bottom up (using filtered nodes to construct the modular pipeline hierachy)

// search logic:
// 1. deal with all highlighted nodes first -> top down approach
// 1.1 filtered modular pipelines and grab nodes from the filtered nodes list ==> all highlighted label
// 1.2 remove all nodes that are already used in this first iteration

// 2. deal with non-highlighted nodes
// 2.1 grab all remaining nodes for the filtered modular pipeliens and put them in a non-lighted way
// 2.2

// 1.1 grab all nodes contained by the filtered modualr pipeline
// 1.2 check all nodes
// 2. filtered nodes

/**
 * returns an array of the corresponding filtered nodes
 * filtered nodes for each modular pipeline
 */
export const getFilteredModularPipelineNodes = createSelector(
  [
    getFilteredNodeItems,
    getFilteredModularPipelineItems,
    (state) => state.modularPipelineIds,
  ],
  (filteredNodeItems, filteredModularPipelines, modularPipelineIDs) => {
    const modularPipelineNodes = arrayToObject(modularPipelineIDs, () => []);
    const { modularPipeline } = filteredModularPipelines;

    // ** important: clean through existing modular pipelines in nodes first to only extract the deepest layer
    // assumption: each node is unique and will only exist once on the flowchart
    Object.keys(filteredNodeItems).forEach((key) => {
      filteredNodeItems[key].map((node, i) => {
        // console.log(`${key} nodes`, node);
        if (node.modularPipelines.length > 1) {
          node.modularPipelines = [
            node.modularPipelines[node.modularPipelines.length - 1],
          ];
        }
      });
    });

    // create a new field for the topmost / root pipeline
    modularPipelineNodes['main'] = [];

    // go through each type of nodes first to identify root level nodes
    Object.keys(filteredNodeItems).forEach((key) => {
      filteredNodeItems[key].map((node, i) => {
        // console.log(`${key} nodes`, node);
        if (node.modularPipelines.length === 0) {
          modularPipelineNodes.main.push(node);
          filteredNodeItems[key].splice(i, 1);
        }
      });
    });

    // go through the set of nodes and slot them into the corresponding modular pipeline array
    modularPipeline.map((mp) => {
      Object.keys(filteredNodeItems).forEach((key) =>
        filteredNodeItems[key].map((nodeItem) => {
          if (nodeItem.modularPipelines.includes(mp.id)) {
            modularPipelineNodes[mp.id].push(nodeItem);
          }
        })
      );
    });

    return modularPipelineNodes;
  }
);

/**
 * returns an array of the corresponding modularPipelines
 * for the filtered nodes
 */
export const getFilteredNodesModularPipelines = createSelector(
  [
    getFilteredNodeItems,
    getFilteredModularPipelineItems,
    (state) => state.modularPipelineIds,
  ],
  (filteredNodeItems, filteredModularPipelines, modularPipelineIDs) => {
    const modularPipelineNodes = arrayToObject(modularPipelineIDs, () => []);
    const { modularPipeline } = filteredModularPipelines;

    // ** important: clean through existing modular pipelines in nodes first to only extract the deepest layer
    // assumption: each node is unique and will only exist once on the flowchart
    Object.keys(filteredNodeItems).forEach((key) => {
      filteredNodeItems[key].map((node, i) => {
        // console.log(`${key} nodes`, node);
        if (node.modularPipelines.length > 1) {
          node.modularPipelines = [
            node.modularPipelines[node.modularPipelines.length - 1],
          ];
        }
      });
    });

    // create a new field for the topmost / root pipeline
    modularPipelineNodes['main'] = [];

    // go through each type of nodes first to identify root level nodes
    Object.keys(filteredNodeItems).forEach((key) => {
      filteredNodeItems[key].map((node, i) => {
        // console.log(`${key} nodes`, node);
        if (node.modularPipelines.length === 0) {
          modularPipelineNodes.main.push(node);
          filteredNodeItems[key].splice(i, 1);
        }
      });
    });

    // go through the set of nodes and slot them into the corresponding modular pipeline array
    modularPipeline.map((mp) => {
      Object.keys(filteredNodeItems).forEach((key) =>
        filteredNodeItems[key].map((nodeItem) => {
          if (nodeItem.modularPipelines.includes(mp.id)) {
            modularPipelineNodes[mp.id].push(nodeItem);
          }
        })
      );
    });

    return modularPipelineNodes;
  }
);

/**
 * returns an array of modular pipelines arranged in a nested structure with corresponding nodes and names
 */
export const getNestedModularPipelines = createSelector(
  [getFilteredModularPipelineItems, getFilteredModularPipelineNodes],
  (modularPipelineItems, modularPipelineNodes) => {
    console.log('filteredModularPipelineNodes', modularPipelineNodes);
    console.log('filteredModularPipelineItems', modularPipelineItems);

    modularPipelineItems = modularPipelineItems.modularPipeline;
    // go through modular pipeline ids to return nested data structure
    const mainTree = {
      nodes: modularPipelineNodes ? modularPipelineNodes.main : [],
      children: [],
      name: 'main',
      id: 'main',
      enabled: true,
      type: 'modularpipeline',
    };
    let level = 1; // this keeps track of how far you are down in the nested pipeline
    let currentParent = mainTree;

    // ** note to self: current set up only works with the assumption that the parent modular pipeline exists
    modularPipelineItems.forEach((modularPipeline) => {
      const { id } = modularPipeline;
      let currentLevel = id.split('.').length;

      // determine the current parent and update level
      if (currentLevel > level) {
        // look for the parent modular pipeline in the new lower level
        let i = id.lastIndexOf('.');
        const parent = id.substr(0, i);
        // check if the current parent exists in the existing list of children

        // assign the current parent if it is the children of the
        currentParent = currentParent.children.filter(
          (mp) => mp.id === parent
        )[0];

        // update the current parent to a new lower level
        level = currentLevel;
      } else if (currentLevel === 1) {
        // update the current parent back to the top parent
        level = 1;
        currentParent = mainTree;
      }

      console.log('currentParent', currentParent);
      // add in the new level and nodes
      currentParent.children.push(
        Object.assign(modularPipeline, {
          children: [],
          nodes: modularPipelineNodes[id],
        })
      );
      //update current level
      level = currentLevel;
    });

    return mainTree;
  }
);
