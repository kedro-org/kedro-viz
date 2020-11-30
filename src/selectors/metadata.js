import { createSelector } from 'reselect';
import { getGraphNodes } from './nodes';

const getClickedNode = state => state.node.clicked;
const getMetaFlag = state => state.flags.meta;

/**
 * Comparison for sorting alphabetically by name, otherwise by value
 */
const sortAlpha = (a, b) => (a.name || a).localeCompare(b.name || b);

/**
 * Returns true if metadata sidebar is visible
 */
export const getVisibleMetaSidebar = createSelector(
  [getClickedNode, getMetaFlag],
  (nodeClicked, metaFlag) => metaFlag && Boolean(nodeClicked)
);

/**
 * Templates for run commands
 */
const runCommandTemplates = {
  data: name => `kedro run --to-inputs ${name}`,
  task: name => `kedro run --to-nodes ${name}`
};

/**
 * Returns run command for the node, if applicable to the node type
 * @param {object} node The node
 * @returns {?string} The run command for the node, if applicable
 */
const getRunCommand = node => {
  const template = runCommandTemplates[node.type];
  return template ? template(node.fullName) : null;
};

/**
 * Example placeholder values for missing APIs
 */
const placeholders = {
  parameters: [
    'num_neighbors:  5',
    'train_ratio:  0.8',
    "dist_metric:  'cosine'",
    "eval_metric:  ['denoise_text', 'filter_pos_tags', 'find_pos_text', 'add_pos_name']"
  ],
  description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec ipsum elit. Morbi interdum ligula nec finibus ultrices. Vivamus vitae sapien vitae nulla elementum maximus id nec dolor. Fusce lacus turpis, egestas ut massa ac, suscipit faucibus augue. Vestibulum fringilla aliquet nibh, vitae accumsan enim placerat in.`,
  path: 'Client001/Nodes/Library/XXX0/pipeline.py',
  filePath: 's3://my-bucket-name/path/to/folder/dataset.parquet'
};

/**
 * Gets metadata for the currently clicked node if any
 */
export const getClickedNodeMetaData = createSelector(
  [
    getClickedNode,
    getGraphNodes,
    state => state.node.tags,
    state => state.tag.name,
    state => state.pipeline
  ],
  (nodeId, nodes = {}, nodeTags, tagNames, pipeline) => {
    const node = nodes[nodeId];

    if (!node) {
      return null;
    }

    const metadata = {
      node,
      tags: [...nodeTags[node.id]]
        .map(tagId => tagNames[tagId])
        .sort(sortAlpha),
      pipeline: pipeline.name[pipeline.active],
      runCommand: getRunCommand(node),
      ...placeholders
    };

    // Note: node.sources node.targets require newgraph enabled
    if (node.sources && node.targets) {
      metadata.inputs = node.sources
        .map(edge => nodes[edge.source])
        .sort(sortAlpha);
      metadata.outputs = node.targets
        .map(edge => nodes[edge.target])
        .sort(sortAlpha);
    }

    return metadata;
  }
);
