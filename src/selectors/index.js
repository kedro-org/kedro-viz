import { createSelector } from 'reselect';
import { formatNode } from './nodes';

const getActivePipeline = state => state.activePipeline;
const getPipelines = state => state.pipelineData;

export const getSnapshotHistory = createSelector(
  [getPipelines],
  (pipelines) => pipelines.get('allIDs').map(id => {
    const snapshot = pipelines.getIn(['snapshots', id]);
    return {
      id: snapshot.get('id'),
      message: snapshot.get('message'),
      timestamp: snapshot.get('timestamp'),
    };
  })
);

export const getRawActivePipeline = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => pipelines.getIn(['snapshots', activePipeline])
);

export const getActivePipelineData = createSelector(
  [getRawActivePipeline],
  activePipeline => activePipeline.toJS()
);

const getEnabledTagCount = createSelector(
  [getRawActivePipeline],
  (pipeline) => pipeline.getIn(['tags', 'enabled']).filter(Boolean).size
);

export const getFormattedNodes = createSelector(
  [getActivePipelineData, getEnabledTagCount],
  (pipeline, enabledTagCount) => {
    const nodes = {};
    pipeline.nodes.allIDs.forEach(id => {
      nodes[id] = formatNode(id, pipeline, enabledTagCount);
    });
    return nodes;
  }
);

export const getNodes = createSelector(
  [getActivePipelineData, getFormattedNodes],
  (pipeline, nodes) => pipeline.nodes.allIDs.sort().map(id => nodes[id])
);

export const getEdges = createSelector(
  [getActivePipelineData, getFormattedNodes],
  (pipeline, nodes) => {
    const { sources, targets } = pipeline.edges;
    return pipeline.edges.allIDs.map(id => {
      return {
        source: nodes[sources[id]],
        target: nodes[targets[id]],
      };
    })
  }
);