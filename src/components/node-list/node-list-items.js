import { createSelector } from 'reselect';
import utils from '@quantumblack/kedro-ui/lib/utils';
import { sidebar } from '../../config';
import IndicatorIcon from '../icons/indicator';
import IndicatorOffIcon from '../icons/indicator-off';
import IndicatorPartialIcon from '../icons/indicator-partial';
import VisibleIcon from '../icons/visible';
import InvisibleIcon from '../icons/invisible';
const { escapeRegExp, getHighlightedText } = utils;

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
          elementType: Object.entries(sidebar.Elements).map(([name, type]) => ({
            id: type,
            name,
          })),
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
        nodeTypeDisabled: nodeType.disabled,
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
 * Return filtered node items
 * @param {object} filteredNodes
 * @param {object} nodeSelected
 * @return {object} Grouped, filtered and sorted node items
 */
export const getFilteredNodeItems = createSelector(
  [getFilteredNodes, (state) => state.nodeSelected],
  ({ filteredNodes }, nodeSelected) => {
    const filteredNodeItems = {};

    for (const type of Object.keys(filteredNodes)) {
      filteredNodeItems[type] = filteredNodes[type]
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
 * Get formatted list of sections
 * @param {boolean} modularPipelineFlag Whether to include modular pipelines
 * @return {object} Map of arrays of sections
 */
export const getSections = createSelector(
  (state) => state.flags.modularpipeline,
  (modularPipelineFlag) => {
    const sections = {};
    const exclude = { modularPipeline: !modularPipelineFlag };

    for (const key of Object.keys(sidebar)) {
      sections[key] = [
        {
          name: key,
          types: Object.values(sidebar[key]).filter((type) => !exclude[type]),
        },
      ];
    }

    return sections;
  }
);

/**
 * Create a new group of items. This can be one of two kinds:
 * 'filter': Categories, e.g. tags
 * 'element': Graph elements, e.g. nodes, datasets, or parameters
 * An item is a node-list row, e.g. a node or a tag.
 * @param {object} groupType Meta information about the group's items
 * @param {array} itemsOfType List of items in the group
 */
export const createGroup = (groupType, itemsOfType = []) => {
  const group = {
    type: groupType,
    id: groupType.id,
    allUnchecked: itemsOfType.every((item) => !item.checked),
    allChecked: itemsOfType.every((item) => item.checked),
  };

  if (groupType.id === 'tag') {
    Object.assign(group, {
      name: 'Tags',
      kind: 'filter',
      checked: !group.allUnchecked,
      visibleIcon: group.allChecked ? IndicatorIcon : IndicatorPartialIcon,
      invisibleIcon: IndicatorOffIcon,
    });
  } else if (groupType.id === 'modularPipeline') {
    Object.assign(group, {
      name: 'Modular Pipelines',
      kind: 'filter',
      checked: !group.allUnchecked,
      visibleIcon: group.allChecked ? IndicatorIcon : IndicatorPartialIcon,
      invisibleIcon: IndicatorOffIcon,
    });
  } else if (groupType.id === 'elementType') {
    Object.assign(group, {
      name: 'Element types',
      kind: 'filter',
      checked: !group.allUnchecked,
      visibleIcon: group.allChecked ? IndicatorIcon : IndicatorPartialIcon,
      invisibleIcon: IndicatorOffIcon,
    });
  } else {
    Object.assign(group, {
      name: groupType.name,
      kind: 'element',
      checked: !groupType.disabled,
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
  [(state) => state.nodeTypes, (state) => state.items],
  (nodeTypes, items) => {
    const groups = {};
    const groupTypes = [
      ...nodeTypes,
      ...Object.values(sidebar.Categories).map((id) => ({ id })),
    ];

    for (const groupType of groupTypes) {
      groups[groupType.id] = createGroup(groupType, items[groupType.id]);
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
