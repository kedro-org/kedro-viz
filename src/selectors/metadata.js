import { createSelector } from 'reselect';
import { getGraphNodes } from './nodes';
const getClickedNode = (state) => state.node.clicked;

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

const renderParameters = (key, value) => {
  if (typeof value === 'object') {
    console.log(value);
    if (Array.isArray(value)) {
      console.log(value);
      if (
        !value.some((v) => {
          return typeof v == 'object';
        })
      ) {
        return `${key}: ${value}`;
      }
    }
    return Object.entries(value).map(([k, v]) => [key, renderParameters(k, v)]);
  } else {
    return `${key}: ${value}`;
  }
};

const prettifyParams = (params) => {
  let newparams = {};
  params.forEach(([key, value]) => {
    //  console.log(key)
    //  console.log(value)
  });
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

    let parameters =
      nodeParameters[node.id] &&
      Object.entries(nodeParameters[node.id]).map(([key, value]) =>
        renderParameters(key, value)
      );

    // let parameters =
    //   nodeParameters[node.id] && JSON.stringify(nodeParameters[node.id])
    // if(parameters){
    //     parameters = parameters.replaceAll(/[{]/g,'\t')
    //     parameters = parameters.replaceAll(/[{]/g,'\t')
    //    // parameters = parameters.replaceAll(/[{}\[,]["|,|{|}|\]|\t][{},]*/g,'\n')
    //    // parameters = parameters.replaceAll("\"","")
    //}
    // console.log(parameters)
    if (parameters) {
      prettifyParams(parameters[0]);
    }

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

    // Note: node.sources node.targets require oldgraph enabled
    if (node.sources && node.targets) {
      metadata.inputs = node.sources
        .map((edge) => nodes[edge.source])
        .sort(sortAlpha);
      metadata.outputs = node.targets
        .map((edge) => nodes[edge.target])
        .sort(sortAlpha);
    }

    return metadata;
  }
);
