import { createSelector } from 'reselect';

const getActivePipeline = state => state.activePipeline;
const getPipelines = state => state.pipelineData;

export const getPipelineData = createSelector(
  [getPipelines],
  (pipelines) => pipelines.get('allIds').map(id => pipelines.getIn(['snapshots', id])).toJS()
);

export const getActivePipelineData = createSelector(
  [getPipelines, getActivePipeline],
  (pipelines, activePipeline) => pipelines.getIn(['snapshots', activePipeline]).toJS()
);

/**
 * Get a node ID and return a single formatted node for use in the app
 * @param {string} id The unique reference for a given node
 * @param {Objects} nodes Complete set of data referring to the node list
 * @param {Object} tags List of tags with their disabled state
 */
const formatNode = (id, { nodes, tags }) => {
  const { data, active, disabled } = nodes;
  const node = data[id];
  node.active = active[id];
  node.disabled_node = disabled[id];
  node.disabled_tag = node.tags.length && !node.tags.some(tag => tags[tag]);
  node.disabled = Boolean(node.disabled_node || node.disabled_tag);
  return node;
};

export const getNodes = createSelector(
  [getActivePipelineData],
  (pipeline) => pipeline.nodes.allIds.sort().map(id => formatNode(id, pipeline))
);

export const getEdges = createSelector(
  [getActivePipelineData],
  (pipeline) => pipeline.edges.allIds.map(id => {
    const { source, target } = pipeline.edges.data[id];
    return {
      source: formatNode(source, pipeline),
      target: formatNode(target, pipeline),
    };
  })
);

export const getTags = createSelector(
  [getActivePipelineData],
  ({ tags }) => Object.keys(tags).sort().map(tagID => ({
    id: tagID,
    name: tagID.replace(/_/g, ' '),
    disabled: !tags[tagID]
  }))
);