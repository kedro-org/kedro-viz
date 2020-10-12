import { createSelector } from 'reselect';
import { getClickedNode, getNodesById } from './nodes';
import { runCommandTemplates } from '../config';

/**
 * Comparison for sorting alphabetically by name, otherwise by value
 */
const sortAlpha = (a, b) => (a.name || a).localeCompare(b.name || b);

/**
 * Returns true if metadata sidebar is visible
 */
export const getVisibleMetaSidebar = createSelector(
  [getClickedNode],
  nodeClicked => Boolean(nodeClicked)
);

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
 * Gets metadata for the currently clicked node if any
 */
export const getClickedNodeMetaData = createSelector(
  [
    getClickedNode,
    getNodesById,
    state => state.node.tags,
    state => state.tag.name,
    state => state.pipeline
  ],
  (nodeId, nodes = {}, nodeTags, tagNames, pipeline) => {
    const node = nodes[nodeId];

    if (node) {
      const metadata = {
        node,
        tags: [...nodeTags[node.id]]
          .map(tagId => tagNames[tagId])
          .sort(sortAlpha),
        pipeline: pipeline.name[pipeline.active],
        runCommand: getRunCommand(node)
      };

      // Note: node.sources node.targets require newgraph enabled
      if (node.sources && node.targets) {
        Object.assign(metadata, {
          inputs: node.sources.map(edge => nodes[edge.source]).sort(sortAlpha),
          outputs: node.targets.map(edge => nodes[edge.target]).sort(sortAlpha)
        });
      }

      return metadata;
    }

    return null;
  }
);
