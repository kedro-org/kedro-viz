import { createSelector } from 'reselect';
import { getGraphNodes } from './nodes';

const getClickedNode = (state) => state.node.clicked;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getNodeName = (state) => state.node.name;

/**
 * Comparison for sorting alphabetically by name, otherwise by value
 */
const sortAlpha = (a, b) => (a.name || a).localeCompare(b.name || b);

/**
 * Returns true if metadata sidebar is visible
 */
export const getVisibleMetaSidebar = createSelector(
  [getClickedNode],
  (nodeClicked) => Boolean(nodeClicked)
);

/**
 * Templates for run commands
 */
const runCommandTemplates = {
  data: (name) => `kedro run --to-inputs ${name}`,
  task: (name) => `kedro run --to-nodes ${name}`,
};

/**
 * Returns run command for the node, if applicable to the node type
 * @param {object} node The node
 * @returns {?string} The run command for the node, if applicable
 */
const getRunCommand = (node) => {
  const template = runCommandTemplates[node.type];
  return template ? template(node.fullName) : null;
};

/**
 * Gets metadata for the currently clicked node if any
 */
export const getClickedNodeMetaData = createSelector(
  [
    getClickedNode,
    getGraphNodes,
    getEdgeIDs,
    getEdgeSources,
    getEdgeTargets,
    getNodeName,
    (state) => state.node.tags,
    (state) => state.tag.name,
    (state) => state.pipeline,
    (state) => state.node.filepath,
    (state) => state.node.code,
    (state) => state.node.parameters,
    (state) => state.node.plot,
    (state) => state.node.datasetType,
  ],
  (
    nodeId,
    nodes = {},
    edgeIDs,
    edgeSources,
    edgeTargets,
    nodeName,
    nodeTags,
    tagNames,
    pipeline,
    nodeFilepaths,
    nodeCodes,
    nodeParameters,
    nodePlot,
    nodeDatasetTypes
  ) => {
    const node = nodes[nodeId];

    if (!node) {
      return null;
    }

    const parameters =
      nodeParameters[node.id] &&
      Object.entries(nodeParameters[node.id]).map(
        ([key, value]) => `${key}: ${value}`
      );

    const metadata = {
      node,
      tags: [...nodeTags[node.id]]
        .map((tagId) => tagNames[tagId])
        .sort(sortAlpha),
      pipeline: pipeline.name[pipeline.active],
      parameters,
      runCommand: getRunCommand(node),
      code: nodeCodes[node.id],
      filepath: nodeFilepaths[node.id],
      plot: nodePlot[node.id],
      datasetType: nodeDatasetTypes[node.id],
    };

    const filteredEdgeIDs = edgeIDs.filter((edge) => edge.includes(node.id));
    const inputs = [];
    const outputs = [];
    for (const edgeID of filteredEdgeIDs) {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      if (source === node.id) {
        inputs.push(nodeName[target]);
      } else {
        outputs.push(nodeName[source]);
      }
    }
    metadata.inputs = inputs.sort(sortAlpha);
    metadata.outputs = outputs.sort(sortAlpha);
    return metadata;
  }
);
