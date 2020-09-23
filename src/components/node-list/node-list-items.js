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
 * Get a list of IDs of the visible nodes
 * @param {object} nodes Grouped nodes
 * @return {array} List of node IDs
 */
export const getNodeIDs = nodes => {
  const getNodeIDs = type => nodes[type].map(node => node.id);
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
  const addHighlightedLabel = node => ({
    highlightedLabel: getHighlightedText(node.name, searchValue),
    ...node
  });
  const addLabelsToNodes = (newNodes, type) => ({
    ...newNodes,
    [type]: nodes[type].map(addHighlightedLabel)
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
  const filterNodesByType = type =>
    nodes[type].filter(node => nodeMatchesSearch(node, searchValue));
  const filterNodeLists = (newNodes, type) => ({
    ...newNodes,
    [type]: filterNodesByType(type)
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
  [state => state.nodes, state => state.searchValue],
  (nodes, searchValue) => {
    const filteredNodes = filterNodes(nodes, searchValue);

    return {
      filteredNodes: highlightMatch(filteredNodes, searchValue),
      nodeIDs: getNodeIDs(filteredNodes)
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
  [state => state.tags, state => state.searchValue],
  (tags, searchValue) =>
    highlightMatch(filterNodes({ tag: tags }, searchValue), searchValue)
);

/**
 * Return filtered/highlighted tag list items
 * @param {object} filteredTags List of filtered tags
 * @param {object} tagsEnabled Map of enabled tags
 * @return {array} Node list items
 */
export const getFilteredTagItems = createSelector(
  [getFilteredTags, state => state.tagsEnabled],
  (filteredTags, tagsEnabled) => ({
    tag: filteredTags.tag.map(tag => ({
      ...tag,
      type: 'tag',
      visibleIcon: IndicatorIcon,
      invisibleIcon: IndicatorOffIcon,
      active: false,
      selected: false,
      faded: false,
      visible: true,
      disabled: false,
      unset: typeof tagsEnabled[tag.id] === 'undefined',
      checked: tagsEnabled[tag.id] === true
    }))
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
  [getFilteredNodes, state => state.nodeSelected],
  ({ filteredNodes }, nodeSelected) => {
    const result = {};

    for (const type of Object.keys(filteredNodes)) {
      result[type] = filteredNodes[type]
        .map(node => {
          const checked = !node.disabled_node;
          const disabled = node.disabled_tag || node.disabled_type;
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
            disabled
          };
        })
        .sort(compareEnabledThenAlpha);
    }

    return result;
  }
);

/**
 * Get formatted list of sections
 * @return {array} List of sections
 */
export const getSections = createSelector(() =>
  Object.keys(sidebar).map(name => ({
    name,
    types: Object.values(sidebar[name])
  }))
);

/**
 * Returns groups of items per type
 * @param {array} types List of node types
 * @param {array} items List of items
 * @return {array} List of groups
 */
export const getGroups = createSelector(
  [state => state.types, state => state.items],
  (nodeTypes, items) => {
    const groups = {};
    const itemTypes = [...nodeTypes, { id: 'tag' }];

    for (const itemType of itemTypes) {
      const itemsOfType = items[itemType.id] || [];

      groups[itemType.id] = {
        type: itemType,
        id: itemType.id,
        name: itemType.name,
        kind: 'toggle',
        visibleIcon: VisibleIcon,
        invisibleIcon: InvisibleIcon,
        checked: !itemType.disabled,
        count: itemsOfType.length,
        allUnset: itemsOfType.every(item => item.unset),
        allChecked: itemsOfType.every(item => item.checked)
      };

      if (itemType.id === 'tag') {
        const group = groups[itemType.id];

        Object.assign(group, {
          name: 'Tags',
          kind: 'filter',
          checked: !group.allUnset,
          visibleIcon: group.allChecked ? IndicatorIcon : IndicatorPartialIcon,
          invisibleIcon: IndicatorOffIcon
        });
      }
    }

    return groups;
  }
);

/**
 * Returns filtered/highlighted tag and node list items
 * @param {object} filteredTags List of filtered tags
 * @param {object} tagsEnabled Map of enabled tags
 * @return {array} Node list items
 */
export const getFilteredItems = createSelector(
  [getFilteredNodeItems, getFilteredTagItems],
  (filteredNodeItems, filteredTagItems) => {
    return {
      ...filteredTagItems,
      ...filteredNodeItems
    };
  }
);
