import { createSelector } from 'reselect';
import utils from '@quantumblack/kedro-ui/lib/utils';
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
      visibleIcon: 'indicator',
      invisibleIcon: 'indicatorOff',
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
            visibleIcon: 'visible',
            invisibleIcon: 'invisible',
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

/**
 * Returns groups of items per type
 * @param {array} types List of types
 * @param {array} items List of items
 * @return {array} List of groups
 */
export const getGroups = createSelector(
  [state => state.types, state => state.items],
  (types, items) => {
    return types.reduce((groups, type) => {
      const itemsOfType = items[type.id] || [];
      const group = (groups[type.id] = {
        type,
        id: type.id,
        kind: 'toggle',
        visibleIcon: 'visible',
        invisibleIcon: 'invisible',
        checked: !type.disabled,
        count: itemsOfType.length,
        allUnset: itemsOfType.every(item => item.unset),
        allChecked: itemsOfType.every(item => item.checked)
      });

      if (type.id === 'tag') {
        Object.assign(group, {
          kind: 'filter',
          checked: !group.allUnset,
          visibleIcon: group.allChecked ? 'indicator' : 'indicatorPartial',
          invisibleIcon: 'indicatorOff'
        });
      }

      return groups;
    }, {});
  }
);
