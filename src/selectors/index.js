import { createSelector } from 'reselect';

const getActivePipeline = state => state.activePipeline;
const getPipelines = state => state.pipelineData;

export const getPipelineData = createSelector(
  [getPipelines],
  (pipelines) => pipelines.allIds.map(id => pipelines.snapshots[id])
);

export const getActivePipelineData = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => pipelines.snapshots[activePipeline]
);

export const getNodes = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => {
    const { nodes } = pipelines.snapshots[activePipeline];
    return nodes.allIds.sort().map(id => nodes.data[id]);
  }
);

export const getEdges = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => {
    const { edges } = pipelines.snapshots[activePipeline];
    return edges.allIds.map(id => edges.data[id]);
  }
);

export const getTags = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => {
    const tags = pipelines.snapshots[activePipeline].tags;
    return Object.keys(tags)
      .sort()
      .map(tagID => ({
        id: tagID,
        name: tagID.replace(/_/g, ' '),
        disabled: !tags[tagID]
      }));
  }
);