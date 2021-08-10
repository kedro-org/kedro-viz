import { createSelector } from 'reselect';
import cloneDeep from 'lodash.clonedeep';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { sidebarGroups, sidebarElementTypes } from '../../config';
import IndicatorIcon from '../icons/indicator';
import IndicatorOffIcon from '../icons/indicator-off';
import IndicatorPartialIcon from '../icons/indicator-partial';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
import { arrayToObject } from '../../utils';
const { escapeRegExp, getHighlightedText } = utils;

export const isTagType = (type) => type === 'tag';
export const isModularPipelineType = (type) => type === 'modularPipeline';
export const isElementType = (type) => type === 'elementType';

export const isGroupType = (type) => isElementType(type) || isTagType(type);

/**
 * Get a list of IDs of the visible nodes from all groups
 * @param {object} nodeGroups Grouped lists of nodes by type
 * @return {array} List of node IDs
 */
export const getNodeIDs = (nodeGroups) =>
  Object.values(nodeGroups).flatMap((nodes) => nodes.map((node) => node.id));

/**
 * Add a new highlightedLabel field to each of the node objects
 * @param {object} nodeGroups Grouped lists of nodes by type
 * @param {string} searchValue Search term
 * @return {object} The grouped nodes with highlightedLabel fields added
 */
export const highlightMatch = (nodeGroups, searchValue) => {
  const highlightedGroups = {};

  for (const type of Object.keys(nodeGroups)) {
    highlightedGroups[type] = nodeGroups[type].map((node) => ({
      ...node,
      highlightedLabel: getHighlightedText(node.name, searchValue),
    }));
  }

  return highlightedGroups;
};

/**
 * Check whether a node matches the search text or true if no search value given
 * @param {object} node
 * @param {string} searchValue
 * @return {boolean} True if node matches or no search value given
 */
export const nodeMatchesSearch = (node, searchValue) => {
  if (searchValue) {
    return new RegExp(escapeRegExp(searchValue), 'gi').test(node.name);
  }

  return true;
};

/**
 * Return only the results that match the search text
 * @param {object} nodeGroups Grouped lists of nodes by type
 * @param {string} searchValue Search term
 * @return {object} Grouped nodes
 */
export const filterNodeGroups = (nodeGroups, searchValue) => {
  const filteredGroups = {};

  for (const nodeGroupId of Object.keys(nodeGroups)) {
    filteredGroups[nodeGroupId] = nodeGroups[nodeGroupId].filter((node) =>
      nodeMatchesSearch(node, searchValue)
    );
  }

  return filteredGroups;
};

/**
 * Return filtered/highlighted nodes, and filtered node IDs
 * @param {object} nodeGroups Grouped lists of nodes by type
 * @param {string} searchValue Search term
 * @return {object} Grouped nodes, and node IDs
 */
export const getFilteredNodes = createSelector(
  [(state) => state.nodes, (state) => state.searchValue],
  (nodeGroups, searchValue) => {
    const filteredGroups = filterNodeGroups(nodeGroups, searchValue);
    return {
      filteredNodes: highlightMatch(filteredGroups, searchValue),
      nodeIDs: getNodeIDs(filteredGroups),
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
    highlightMatch(filterNodeGroups({ tag: tags }, searchValue), searchValue)
);

/**
 * Return filtered/highlighted tag list items
 * @param {object} filteredTags List of filtered tags
 * @return {array} Node list items
 */
export const getFilteredTagItems = createSelector(
  [getFilteredTags, (state) => state.tagNodeCounts],
  (filteredTags, tagNodeCounts = {}) => ({
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
      checked: tag.enabled,
      count: tagNodeCounts[tag.id] || 0,
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
      filterNodeGroups({ modularPipeline: modularPipelines }, searchValue),
      searchValue
    )
);

/**
 * Return filtered/highlighted modular pipeline list items
 * @param {object} filteredModularPipelines List of filtered modularPipelines
 * @return {array} Node list items
 */
export const getFilteredModularPipelineItems = createSelector(
  [getFilteredModularPipelines, (state) => state.focusMode],
  (filteredModularPipelines, focusMode) => ({
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
        disabled: focusMode !== null && focusMode?.id !== modularPipeline.id,
        checked: modularPipeline.enabled,
      })
    ),
  })
);

/**
 * Return filtered/highlighted element types
 * @param {string} searchValue Search term
 * @return {object} Grouped element types
 */
export const getFilteredElementTypes = createSelector(
  [(state) => state.searchValue],
  (searchValue) =>
    highlightMatch(
      filterNodeGroups(
        {
          elementType: Object.entries(sidebarElementTypes).map(
            ([type, name]) => ({
              id: type,
              name,
            })
          ),
        },
        searchValue
      ),
      searchValue
    )
);

/**
 * Return filtered/highlighted element type items
 * @param {object} filteredTags List of filtered element types
 * @param {array} nodeTypes List of node types
 * @return {object} Element type items
 */
export const getFilteredElementTypeItems = createSelector(
  [getFilteredElementTypes, (state) => state.nodeTypes],
  (filteredElementTypes, nodeTypes) => ({
    elementType: filteredElementTypes.elementType.map((elementType) => {
      const nodeType = nodeTypes.find((type) => type.id === elementType.id);

      return {
        ...elementType,
        type: 'elementType',
        visibleIcon: IndicatorIcon,
        invisibleIcon: IndicatorOffIcon,
        active: false,
        selected: false,
        faded: false,
        visible: true,
        disabled: false,
        checked: nodeType.disabled === false,
        count: nodeType.nodeCount.total,
      };
    }),
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
  const nodeTypeIDs = Object.keys(sidebarElementTypes);
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
  [
    getFilteredNodes,
    (state) => state.nodeSelected,
    (state) => state.focusMode,
    (state) => state.inputOutputDataNodes,
  ],
  ({ filteredNodes }, nodeSelected, focusMode, inputOutputDataNodes) => {
    const filteredNodeItems = {};

    for (const type of Object.keys(filteredNodes)) {
      filteredNodeItems[type] = filteredNodes[type]
        .map((node) => {
          const checked = !node.disabled_node;
          const disabled =
            node.disabled_tag ||
            node.disabled_type ||
            node.disabled_modularPipeline ||
            (focusMode !== null && !!inputOutputDataNodes[node.id]);

          return {
            ...node,
            visibleIcon: VisibleIcon,
            invisibleIcon: InvisibleIcon,
            active: undefined,
            selected: nodeSelected[node.id],
            faded: disabled || node.disabled_node,
            visible: !disabled && checked,
            checked,
            disabled,
          };
        })
        .sort(compareEnabledThenAlpha);
    }

    return filteredNodeItems;
  }
);

/**
 * Returns group items for each sidebar filter group defined in the sidebar config.
 * @param {object} items List items by group type
 * @return {array} List of groups
 */
export const getGroups = createSelector([(state) => state.items], (items) => {
  const groups = {};

  for (const [type, name] of Object.entries(sidebarGroups)) {
    const itemsOfType = items[type] || [];
    const allUnchecked = itemsOfType.every((item) => !item.checked);
    const allChecked = itemsOfType.every((item) => item.checked);

    groups[type] = {
      type,
      name,
      id: type,
      kind: 'filter',
      allUnchecked: itemsOfType.every((item) => !item.checked),
      allChecked: itemsOfType.every((item) => item.checked),
      checked: !allUnchecked,
      visibleIcon: allChecked ? IndicatorIcon : IndicatorPartialIcon,
      invisibleIcon: IndicatorOffIcon,
    };
  }

  return groups;
});

/**
 * Returns filtered/highlighted items for nodes, tags and modular pipelines
 * @param {object} filteredNodeItems List of filtered nodes
 * @param {object} filteredTagItems List of filtered tags
 * @param {object} filteredModularPipelinesItems List of filtered modularPipelines
 * @return {array} final list of all filtered items from the three filtered item sets
 */
export const getFilteredItems = createSelector(
  [
    getFilteredNodeItems,
    getFilteredTagItems,
    getFilteredModularPipelineItems,
    getFilteredElementTypeItems,
  ],
  (
    filteredNodeItems,
    filteredTagItems,
    filteredModularPipelineItems,
    filteredElementTypeItems
  ) => ({
    ...filteredTagItems,
    ...filteredNodeItems,
    ...filteredModularPipelineItems,
    ...filteredElementTypeItems,
  })
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
    (state) => state.focusMode,
  ],
  (filteredNodeItems, modularPipelines, nodeTypeIDs, focusMode) => {
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
              ),
              focusMode
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
const constructModularPipelineItem = (modularPipeline, focusMode) => ({
  ...modularPipeline,
  type: 'modularPipeline',
  icon: 'modularPipeline',
  visibleIcon: VisibleIcon,
  invisibleIcon: InvisibleIcon,
  active: false,
  selected: false,
  faded: false,
  visible: true,
  disabled: focusMode !== null && focusMode?.id !== modularPipeline.id,
  checked: modularPipeline.enabled,
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
    (state) => state.focusMode,
  ],
  (
    filteredModularPipelines,
    filteredNodeModularPipelines,
    modularPipelines,
    focusMode
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
              ),
              focusMode
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
