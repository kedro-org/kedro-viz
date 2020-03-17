import { createSelector } from 'reselect';
import batchingToposort from 'batching-toposort';
import { getVisibleNodeIDs } from './disabled';
import { getVisibleEdges } from './edges';

const getLayerIDs = state => state.layer.ids;
const getNodeLayer = state => state.node.layer;

/**
 * Get list of visible nodes for each visible layer
 */
export const getLayerNodes = createSelector(
  [getVisibleNodeIDs, getNodeLayer, getLayerIDs],
  (nodeIDs, nodeLayer, layerIDs) => {
    // Create object containing a list of every node for each layer
    const layerNodes = {};
    for (const nodeID of nodeIDs) {
      const layer = nodeLayer[nodeID];
      if (!layerNodes[layer]) {
        layerNodes[layer] = [];
      }
      layerNodes[layer].push(nodeID);
    }

    // Convert into an ordered list, and filter out the unused layers
    const visibleLayerNodes = [];
    for (const layerID of layerIDs) {
      if (layerNodes[layerID]) {
        visibleLayerNodes.push(layerNodes[layerID]);
      }
    }

    return visibleLayerNodes;
  }
);

/**
 * Calculate ranks (vertical placement) for each node,
 * by toposorting while taking layers into account
 */
export const getNodeRank = createSelector(
  [getVisibleNodeIDs, getVisibleEdges, getLayerNodes],
  (nodeIDs, edges, layerNodes) => {
    // For each node, create a list of nodes that depend on that node
    const nodeDeps = {};

    // Initialise empty dependency arrays for each node
    for (const nodeID of nodeIDs) {
      nodeDeps[nodeID] = [];
    }

    // Add dependencies for visible edges
    for (const edge of edges) {
      nodeDeps[edge.source].push(edge.target);
    }

    // Add "false edge" dependencies for layered nodes to prevent layer overlaps
    for (let i = 1; i < layerNodes.length; i++) {
      for (const sourceID of layerNodes[i - 1]) {
        for (const targetID of layerNodes[i]) {
          nodeDeps[sourceID].push(targetID);
        }
      }
    }

    // Run toposort algorithm to rank nodes by dependency
    const toposortedNodes = batchingToposort(nodeDeps);

    // Convert toposort order into rank numbering
    const nodeRanks = {};
    for (let rank = 0; rank < toposortedNodes.length; rank++) {
      for (const nodeID of toposortedNodes[rank]) {
        nodeRanks[nodeID] = rank;
      }
    }

    return nodeRanks;
  }
);
