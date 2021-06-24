import { createSelector } from 'reselect';
import cloneDeep from 'lodash.clonedeep';
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
        icon: 'modularPipeline',
        visibleIcon: VisibleIcon,
        invisibleIcon: InvisibleIcon,
        active: false,
        selected: false,
        faded: false,
        visible: true,
        disabled: false,
        unset: false,
        checked: true,
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
 * Compares items for sorting in each modularPipeline in the nested tree structure
 * by enabled status (by tag) and then alphabeticaly (by type)
 * @param {object} itemA First item to compare
 * @param {object} itemB Second item to compare
 * @return {number} Comparison result
 */
const compareEnabledThenType = (itemA, itemB) => {
  const byEnabledTag = Number(itemA.disabled_tag) - Number(itemB.disabled_tag);
  const nodeTypeIDs = ['task', 'data', 'parameters'];
  const byNodeType =
    nodeTypeIDs.indexOf(itemA.type) - nodeTypeIDs.indexOf(itemB.type);
  return byEnabledTag !== 0 ? byEnabledTag : byNodeType;
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

/**
 * returns the corresponding filtered parent modular pipelines
 * for each filtered node
 */
export const getFilteredNodeModularPipelines = createSelector(
  [
    getFilteredNodeItems,
    (state) => state.modularPipelines,
    (state) => state.nodeTypeIDs,
  ],
  (filteredNodeItems, modularPipelines, nodeTypeIDs) => {
    const filteredNodeModularPipelines = [];

    const nodeItems = cloneDeep(filteredNodeItems);

    nodeTypeIDs.forEach((nodeTypeId) => {
      nodeItems[nodeTypeId]?.forEach((filteredNode) => {
        filteredNode.modularPipelines.forEach((nodeModularPipeline) => {
          filteredNodeModularPipelines.push(
            constructModularPipelineItem(
              modularPipelines.find(
                (rawModularPipeline) =>
                  rawModularPipeline.id === nodeModularPipeline
              )
            )
          );
        });
      });
    });

    return filteredNodeModularPipelines;
  }
);

/**
 * constructs a modular pipeline item for filtered modular pipeline parents that does not exist in filtered modular pipeline items
 * @param {obj} modularPipeline the modular pipeine that needs the construction of a modular pipeline item
 * @return {obj} modular pipeline item
 */
const constructModularPipelineItem = (modularPipeline) => ({
  ...modularPipeline,
  type: 'modularPipeline',
  visibleIcon: VisibleIcon,
  invisibleIcon: InvisibleIcon,
  active: false,
  selected: false,
  faded: false,
  visible: true,
  disabled: false,
  unset: false,
  checked: true,
});

/**
 * returns the corresponding parent modular pipelines
 * for all filtered modular pipelines
 */
export const getFilteredModularPipelineParent = createSelector(
  [
    getFilteredModularPipelineItems,
    getFilteredNodeModularPipelines,
    (state) => state.modularPipelines,
  ],
  (
    filteredModularPipelines,
    filteredNodeModularPipelines,
    modularPipelines
  ) => {
    const filteredModularPipelineParents = [];
    const filteredModularPipeline = filteredModularPipelines.modularPipeline;

    // 1. extract only modular pipelines with additional namespace
    const childrenModularPipelines = filteredModularPipeline.filter(
      (modularPipeline) => modularPipeline.id.includes('.')
    );

    const checkFilteredModularPipelineList = (modularPipeLineList, parent) =>
      !modularPipeLineList.some(
        (modularPipeline) => modularPipeline.id === parent
      );

    const checkFilteredNodeModularPipelineList = (
      filteredNodeModularPipelinesList,
      parent
    ) =>
      !filteredNodeModularPipelinesList.some(
        (modularPipeline) => modularPipeline.id === parent
      );

    // extract the parents only for those modular pipelines that does not have a filtered parent
    childrenModularPipelines.forEach((childrenModularPipeline) => {
      const levels = childrenModularPipeline.id.match(/\./g)
        ? childrenModularPipeline.id.match(/\./g).length
        : 0;

      let lastIndex = 0;

      for (let i = 0; i <= levels - 1; i++) {
        // obtain the name of that pipeline
        let parent = childrenModularPipeline.id.substr(
          0,
          childrenModularPipeline.id.indexOf('.', lastIndex)
        );

        // check against the filtered modular pipeline, existing list of parent pipelines and also the filtered node parent list
        if (
          checkFilteredModularPipelineList(filteredModularPipeline, parent) &&
          !filteredModularPipelineParents.some(
            (modularPipeline) => modularPipeline.id === parent
          ) &&
          checkFilteredNodeModularPipelineList(
            filteredNodeModularPipelines,
            parent
          )
        ) {
          // add the relevant modular pipeline to the list of parents
          filteredModularPipelineParents.push(
            // construct the item needed and then add it to the list
            constructModularPipelineItem(
              modularPipelines.find(
                (rawModularPipeline) => rawModularPipeline.id === parent
              )
            )
          );
        }
        lastIndex = childrenModularPipeline.id.indexOf('.', lastIndex) + 1;
      }
    });

    return filteredModularPipelineParents;
  }
);

/**
 * returns the corresponding final set of modular pipelines
 * for constructing the final nested tree list
 */
export const getFilteredTreeItems = createSelector(
  [
    getFilteredModularPipelineItems,
    getFilteredNodeModularPipelines,
    getFilteredModularPipelineParent,
    (state) => state.modularPipelines,
  ],
  (
    modularPipelineItems,
    nodeModularPipelines,
    modularPipelineParent,
    modularPipelines
  ) => {
    modularPipelineItems = modularPipelineItems.modularPipeline;

    let finalModularPipelines = [];

    const checkModularPipelineItems = (modularPipelineItems, modularPipeline) =>
      modularPipelineItems.some(
        (modularPipelineItem) => modularPipelineItem.id === modularPipeline.id
      );

    const checkNodeModularPipelines = (nodeModularPipelines, modularPipeline) =>
      nodeModularPipelines.some(
        (nodeModularPipeline) => nodeModularPipeline.id === modularPipeline.id
      );

    const checkModularPipelineParentPipeline = (
      modularPipelineParent,
      modularPipeline
    ) =>
      modularPipelineParent.some(
        (modularPipelineParentPipeline) =>
          modularPipelineParentPipeline.id === modularPipeline.id
      );

    // sort all 3 sets of modular pipelines according to the original order
    modularPipelines?.forEach((modularPipeline) => {
      if (checkModularPipelineItems(modularPipelineItems, modularPipeline)) {
        finalModularPipelines.push(
          modularPipelineItems.find(
            (modularPipelineItem) =>
              modularPipelineItem.id === modularPipeline.id
          )
        );
      } else if (
        checkNodeModularPipelines(nodeModularPipelines, modularPipeline)
      ) {
        finalModularPipelines.push(
          nodeModularPipelines.find(
            (nodeModularPipeline) =>
              nodeModularPipeline.id === modularPipeline.id
          )
        );
      } else if (
        checkModularPipelineParentPipeline(
          modularPipelineParent,
          modularPipeline
        )
      ) {
        finalModularPipelines.push(
          modularPipelineParent.find(
            (modularPipelineParentPipeline) =>
              modularPipelineParentPipeline.id === modularPipeline.id
          )
        );
      }
    });

    return finalModularPipelines;
  }
);

/**
 * returns an array of the corresponding filtered nodes
 * & unfiltered nodes for each filtered modular pipeline
 */
export const getFilteredModularPipelineNodes = createSelector(
  [
    getFilteredNodeItems,
    getFilteredTreeItems,
    (state) => state.modularPipelineIds,
    (state) => state.nodeTypeIDs,
  ],
  (filteredNodeItems, filteredTreeItems, modularPipelineIDs, nodeTypeIDs) => {
    const modularPipelineNodes = arrayToObject(modularPipelineIDs, () => []);

    const nodeItems = cloneDeep(filteredNodeItems);

    // assumption: each node is unique and will only exist once on the flowchart, hence we are only taking
    // the deepest nested modular pipeline as the node's modular pipeline
    nodeTypeIDs.forEach((nodeTypeId) => {
      // extract the last modular pipeline within the array of filtered nodes
      nodeItems[nodeTypeId]?.forEach((node) => {
        if (node.modularPipelines.length > 1) {
          node.modularPipelines = node.modularPipelines.slice(-1);
        }
      });
    });

    // create a new field for the topmost / root pipeline
    modularPipelineNodes.main = [];

    // go through each type of nodes according to the order of specified node types in normalize-data
    // first to identify root level nodes
    nodeTypeIDs.forEach((nodeTypeId) => {
      nodeItems[nodeTypeId]?.forEach((node, i) => {
        if (node.modularPipelines.length === 0) {
          modularPipelineNodes.main.push(node);
          nodeItems[nodeTypeId].splice(i, 1);
        }
      });
    });

    // further sort nodes according to status
    modularPipelineNodes.main.sort(compareEnabledThenType);

    // go through the set of nodes and slot them into the corresponding modular pipeline array
    filteredTreeItems.forEach((modularPipeline) => {
      nodeTypeIDs.forEach((nodeTypeId) => {
        nodeItems[nodeTypeId]?.forEach((nodeItem) => {
          if (nodeItem.modularPipelines.includes(modularPipeline.id)) {
            modularPipelineNodes[modularPipeline.id].push(nodeItem);
          }
        });
      });
      modularPipelineNodes[modularPipeline.id].sort(compareEnabledThenType);
    });

    return modularPipelineNodes;
  }
);

/**
 * returns an array of modular pipelines arranged in a nested structure with corresponding nodes and names
 */
export const getNestedModularPipelines = createSelector(
  [
    getFilteredTreeItems,
    getFilteredModularPipelineNodes,
    (state) => state.modularPipelines,
  ],
  (filteredTreeItems, modularPipelineNodes) => {
    // go through modular pipeline ids to return nested data structure
    const mainTree = {
      nodes: modularPipelineNodes ? modularPipelineNodes.main : [],
      children: [],
      name: 'main',
      id: 'main',
      enabled: true,
      type: 'modularpipeline',
    };
    let currentParent = mainTree;

    filteredTreeItems?.forEach((modularPipeline) => {
      const { id } = modularPipeline;
      let currentLevel = id.split('.').length;

      if (currentLevel > 1) {
        let lastIndex = 0;
        let parents = [];
        // obtain all parents for that level
        for (let i = 0; i <= currentLevel - 1; i++) {
          // obtain the name of that pipeline
          parents.push(id.substr(0, id.indexOf('.', lastIndex)));
          lastIndex = id.indexOf('.', lastIndex) + 1;
        }

        // remove any empty instance
        parents = parents.filter((e) => e);

        let parent = mainTree;

        // go through each level to obtain the child
        parents.forEach((id) => {
          parent = parent.children.find(
            (modularPipeline) => modularPipeline.id === id
          );
        });

        currentParent = parent;
      } else {
        currentParent = mainTree;
      }

      // add in the new level and nodes
      currentParent.children.push(
        Object.assign(modularPipeline, {
          children: [],
          nodes: modularPipelineNodes[id],
        })
      );
    });

    return mainTree;
  }
);
