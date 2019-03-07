import { createSelector } from 'reselect';
import { formatNode } from './nodes';

const getActivePipeline = state => state.activePipeline;
const getPipelines = state => state.pipelineData;
const getView = state => state.view;

/**
 * Retrieve list of snapshots used in History tab
 */
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

/**
 * Retrieve active pipeline data in Immutable object format
 */
export const getRawActivePipeline = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => pipelines.getIn(['snapshots', activePipeline])
);

/**
 * Retrieve active pipeline data converted back into regular JS
 */
export const getActivePipelineData = createSelector(
  [getRawActivePipeline],
  activePipeline => activePipeline ? activePipeline.toJS() : {
    message: null,
    id: null,
    timestamp: null,
    nodes: null,
    edges: null,
    tags: null
  }
);

/**
 * Return the raw unformatted data schema for the active snapshot
 */
export const getActiveSchema = createSelector(
  [getActivePipeline, getPipelines],
  (activePipeline, pipelines) => {
    if (activePipeline) {
      return JSON.stringify(
        pipelines.getIn(['schemas', activePipeline]).toJS()
      );
    }
    return '[]';
  }
);

/**
 * Retrieve the total number of tags that have been enabled
 */
const getEnabledTagCount = createSelector(
  [getRawActivePipeline],
  (pipeline) => {
    const enabledTags = pipeline && pipeline.getIn(['tags', 'enabled']);
    return enabledTags ? enabledTags.filter(Boolean).size : null;
  }
);

/**
 * Retrieve the set of nodes as an object,
 * but reformatted for use in nodes and edges selectors
 */
export const getFormattedNodes = createSelector(
  [getActivePipelineData, getEnabledTagCount, getView],
  (pipeline, enabledTagCount, view) => {
    if (!pipeline.nodes) {
      return null;
    }
    const nodes = {};
    pipeline.nodes.allIDs.forEach(id => {
      nodes[id] = formatNode(id, pipeline, enabledTagCount, view);
    });
    return nodes;
  }
);

/**
 * Get formatted nodes as an array
 */
export const getNodes = createSelector(
  [getActivePipelineData, getFormattedNodes],
  (pipeline, nodes) =>
    pipeline.nodes ? pipeline.nodes.allIDs.sort().map(id => nodes[id]) : null
);

/**
 * Determine whether an edge should be disabled
 * @param {Object} source Node ID for the preceding node
 * @param {Object} target Node ID for the succeeding node
 * @param {string} view Current view setting (combined, task, data)
 */
const edgeDisabled = (source, target, view) => {
  if (source.disabled || target.disabled) {
    return true;
  }
  if (view === 'combined') {
    return source.type === target.type;
  }
  return view !== source.type || view !== target.type;
}

/**
 * Format edges and return them as an array
 */
export const getEdges = createSelector(
  [getActivePipelineData, getFormattedNodes, getView],
  (pipeline, nodes, view) => {
    if (!pipeline.edges) {
      return null;
    }
    const { sources, targets } = pipeline.edges;
    return pipeline.edges.allIDs.map(id => {
      const source = nodes[sources[id]];
      const target = nodes[targets[id]];
      return {
        disabled: edgeDisabled(source, target, view),
        source,
        target,
      };
    })
  }
);