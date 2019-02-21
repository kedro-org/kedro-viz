import { createSelector } from 'reselect';

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
  const nodeTags = nodes.tags[id];
    // Set active status if the node is specifically highlighted, and/or via an associated tag
  const active_node = nodes.active[id];
  const active_tag = nodeTags.some(tag => tags.active[tag]);
    // Set disabled status if the node is specifically hidden, and/or via an associated tag
  const disabled_node = nodes.disabled[id];
  const disabled_tag = nodeTags.length && nodeTags.every(tag => tags.disabled[tag]);
  return {
    id,
    name: id.replace(/_/g, ' '),
    tags: nodes.tags[id],
    type: nodes.type[id],
    active_node,
    active_tag,
    active: Boolean(active_node || active_tag),
    disabled_node,
    disabled_tag,
    disabled: Boolean(disabled_node || disabled_tag),
  };
};

export const getNodes = createSelector(
  [getActivePipelineData],
  (pipeline) => pipeline.nodes.allIDs.sort().map(id => formatNode(id, pipeline))
);

export const getEdges = createSelector(
  [getActivePipelineData],
  (pipeline) => pipeline.edges.allIDs.map(id => {
    // const { source, target } = pipeline.edges.data[id];
    const source = pipeline.edges.sources[id];
    const target = pipeline.edges.targets[id];
    return {
      source: formatNode(source, pipeline),
      target: formatNode(target, pipeline),
    };
  })
);

export const getTags = createSelector(
  [getActivePipelineData],
  ({ tags }) => tags.allIDs.sort().map(id => ({
    id,
    name: id.replace(/_/g, ' '),
    active: tags.active[id],
    disabled: tags.disabled[id],
  }))
);