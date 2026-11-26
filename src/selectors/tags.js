import { createSelector } from 'reselect';
import { getPipelineTagIDs } from './pipeline';
import { prettifyName } from '../utils';

const getNodeTags = (state) => state.node.tags;
const getNodeType = (state) => state.node.type;
const getTagName = (state) => state.tag.name;
const getTagActive = (state) => state.tag.active;
const getTagEnabled = (state) => state.tag.enabled;

/**
 * Retrieve the formatted list of tag filters
 */
export const getTagData = createSelector(
  [getPipelineTagIDs, getTagName, getTagActive, getTagEnabled],
  (tagIDs, tagName, tagActive, tagEnabled) =>
    tagIDs.sort().map((id) => ({
      id,
      name: tagName[id] || prettifyName(id),
      active: Boolean(tagActive[id]),
      enabled: Boolean(tagEnabled[id]),
    }))
);

/**
 * Get the total and enabled number of tags
 */
export const getTagCount = createSelector(
  [getPipelineTagIDs, getTagEnabled],
  (tagIDs, tagEnabled) => ({
    total: tagIDs.length,
    enabled: tagIDs.filter((id) => tagEnabled[id]).length,
  })
);

/**
 * Get the total number of nodes for each tag
 */
export const getTagNodeCounts = createSelector(
  [getNodeTags, getNodeType],
  (nodeTags, nodeType = {}) => {
    const counts = {};

    for (const [nodeId, tagIds] of Object.entries(nodeTags)) {
      if (nodeType[nodeId] === 'modularPipeline') {
        continue;
      }
      for (const tagId of tagIds) {
        counts[tagId] = counts[tagId] + 1 || 1;
      }
    }

    return counts;
  }
);
