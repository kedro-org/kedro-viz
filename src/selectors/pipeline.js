import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';

const getNodeIDs = state => state.node.ids;
const getNodePipelines = state => state.node.pipelines;
const getActivePipeline = state => state.pipeline.active;
const getTagIDs = state => state.tag.ids;
const getNodeTags = state => state.node.tags;

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledPipeline = createSelector(
  [getNodeIDs, getNodePipelines, getActivePipeline],
  (nodeIDs, nodePipelines, activePipeline) =>
    arrayToObject(nodeIDs, nodeID => {
      if (!activePipeline) {
        return false;
      }
      return !nodePipelines[nodeID][activePipeline];
    })
);

/**
 * Get a list of just the IDs for the active pipeline
 */
export const getPipelineNodeIDs = createSelector(
  [getNodeIDs, getNodeDisabledPipeline],
  (nodeIDs, nodeDisabledPipeline) =>
    nodeIDs.filter(nodeID => !nodeDisabledPipeline[nodeID])
);

/**
 * Get IDs of tags used in the current pipeline
 */
export const getPipelineTagIDs = createSelector(
  [getTagIDs, getPipelineNodeIDs, getNodeTags],
  (tagIDs, nodeIDs, nodeTags) => {
    const visibleTags = {};
    for (let tagID of tagIDs) {
      for (let nodeID of nodeIDs) {
        if (nodeTags[nodeID].includes(tagID)) {
          visibleTags[tagID] = true;
          break;
        }
      }
    }
    return tagIDs.filter(tagID => visibleTags[tagID]);
  }
);
