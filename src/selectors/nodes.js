import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';

const getView = state => state.view;
const getActiveSnapshot = state => state.activeSnapshot;
const getSnapshotNodes = state => state.snapshotNodes;
const getNodeName = state => state.nodeName;
const getNodeActiveNode = state => state.nodeActive;
const getNodeDisabledNode = state => state.nodeDisabled;
const getNodeTags = state => state.nodeTags;
const getNodeType = state => state.nodeType;
const getTagActive = state => state.tagActive;
const getTagEnabled = state => state.tagEnabled;

/**
 * Get a list of nodes for the active snapshot
 */
export const getActiveSnapshotNodes = createSelector(
  [getActiveSnapshot, getSnapshotNodes],
  (activeSnapshot, snapshotNodes) => snapshotNodes[activeSnapshot]
);

/**
 * Retrieve the total number of tags that have been enabled
 */
export const getEnabledTagCount = createSelector(
  [getActiveSnapshot, getTagEnabled],
  (activeSnapshot, tagEnabled) => {
    const enabledTags = tagEnabled[activeSnapshot];
    return enabledTags ? enabledTags.filter(Boolean).length : null;
  }
);

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledTag = createSelector(
  [
    getActiveSnapshotNodes,
    getTagEnabled,
    getEnabledTagCount,
    getNodeTags,
  ],
  (
    activeSnapshotNodes,
    tagEnabled,
    enabledTagCount,
    nodeTags,
  ) => arrayToObject(activeSnapshotNodes, (nodeID) => {
    if (enabledTagCount === 0) {
      return false;
    }
    if (nodeTags[nodeID].length) {
      // Hide task nodes that don't have at least one tag filter enabled
      return !nodeTags[nodeID].some(tag => tagEnabled[tag]);
    }
    return true;
  })
);

/**
 * Calculate whether nodes should be disabled based on the view
 */
export const getNodeDisabledView = createSelector(
  [
    getActiveSnapshotNodes,
    getNodeType,
    getView,
  ],
  (
    activeSnapshotNodes,
    nodeType,
    view,
  ) => arrayToObject(activeSnapshotNodes, (nodeID) =>
    view !== 'combined' && view !== nodeType[nodeID]
  )
);


/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view
 */
export const getNodeDisabled = createSelector(
  [
    getActiveSnapshotNodes,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledView
  ],
  (
    activeSnapshotNodes,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledView,
  ) => arrayToObject(activeSnapshotNodes, (id) => Boolean(
    nodeDisabledNode[id] || nodeDisabledTag[id] || nodeDisabledView[id]
  ))
);


  /**
   * Set active status if the node is specifically highlighted, and/or via an associated tag
   * @return {Boolean} True if active
   */
export const getNodeActive = createSelector(
  [
    getActiveSnapshotNodes,
    getNodeActiveNode,
    getNodeTags,
    getTagActive,
  ],
  (
    activeSnapshotNodes,
    nodeActiveNode,
    nodeTags,
    tagActive,
  ) => arrayToObject(activeSnapshotNodes, (nodeID) => {
    const activeViaNode = nodeActiveNode[nodeID];
    const activeViaTag = nodeTags[nodeID].some(tag => tagActive[tag]);
    return Boolean(activeViaNode || activeViaTag);
  })
);

/**
 * Get formatted nodes as an array
 */
export const getNodes = createSelector(
  [
    getActiveSnapshotNodes,
    getNodeName,
    getNodeActive,
    getNodeDisabled,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledView,
  ],
  (
    activeSnapshotNodes,
    nodeName,
    nodeActive,
    nodeDisabled,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledView,
  ) => activeSnapshotNodes.map(id => ({
    id,
    name: nodeName[id],
    active: nodeActive[id],
    disabled: nodeDisabled[id],
    disabled_node: nodeDisabledNode[id],
    disabled_tag: nodeDisabledTag[id],
    disabled_view: nodeDisabledView[id],
  }))
);