import { createSelector } from 'reselect';
import { getModularPipelineChildren } from './modular-pipelines';
import { getVisibleNodeIDs, getVisibleModularPipelineIDs } from './disabled';
import { getCombinedEdges } from './edges';
import { arrayToObject } from '../utils';

const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineContracted = (state) =>
  state.modularPipeline.contracted;
const getNodeName = (state) => state.node.name;
const getNodeFullName = (state) => state.node.fullName;
const getNodeType = (state) => state.node.type;
const getLayerIDs = (state) => state.layer.ids;
const getLayersVisible = (state) => state.layer.visible;
const getNodeLayer = (state) => state.node.layer;

/**
 * Collapse modular pipelines by replacing standalone MP children with MP nodes,
 * and collapsing edges that link from a modular pipeline's node to itself.
 */
export const getContractedModularPipelines = createSelector(
  [
    getVisibleModularPipelineIDs,
    getModularPipelineChildren,
    getModularPipelineContracted,
    getModularPipelineName,
    getVisibleNodeIDs,
    getNodeName,
    getNodeFullName,
    getNodeType,
    getNodeLayer,
    getCombinedEdges,
  ],
  (
    modularPipelineIDs,
    modularPipelineChildren,
    modularPipelineContracted,
    modularPipelineName,
    nodeIDs,
    nodeName,
    nodeFullName,
    nodeType,
    nodeLayer,
    combinedEdges
  ) => {
    // List of nodes, but converting the IDs to an object to improve performance
    const node = {
      ids: arrayToObject(nodeIDs, () => true),
      name: { ...nodeName },
      fullName: { ...nodeFullName },
      type: { ...nodeType },
      layer: { ...nodeLayer },
      modularPipeline: {},
    };

    // List of edges, but converting the IDs to an object to improve performance
    const edge = {
      ids: arrayToObject(combinedEdges.ids, () => true),
      sources: { ...combinedEdges.sources },
      targets: { ...combinedEdges.targets },
    };

    /**
     * Add a new node to replace existing node(s)
     * @param {string} modPipID Modular pipeline ID
     * @param {string} nodeID A node ID, to ensure uniqueness
     * @returns {string} The ID for the new node
     */
    const addNode = (modPipID, nodeID) => {
      const id = [modPipID, nodeID].join('-');
      node.ids[id] = true;
      node.name[id] = modularPipelineName[modPipID];
      node.fullName[id] = modPipID;
      node.type[id] = 'pipeline';
      node.layer[id] = node.layer[nodeID];
      node.modularPipeline[id] = modPipID;
      return id;
    };

    /**
     * Delete old nodes
     * @param {string} nodeID A node ID
     */
    const deleteNode = (nodeID) => {
      delete node.ids[nodeID];
      delete node.name[nodeID];
      delete node.fullName[nodeID];
      delete node.type[nodeID];
      delete node.layer[nodeID];
      delete node.modularPipeline[nodeID];
    };

    /**
     * Add a new edge between a source and a target
     * @param {string} source A source node ID
     * @param {string} target A target node ID
     */
    const addEdge = (source, target) => {
      // Add the new edge
      const newEdgeID = [source, target].join('|');
      edge.ids[newEdgeID] = true;
      edge.sources[newEdgeID] = source;
      edge.targets[newEdgeID] = target;

      // Handle potential cycle given the new edge
      deleteCyclicEdge(newEdgeID);
    };

    /**
     * Delete old edges
     * @param {string} edgeID An edge ID
     */
    const deleteEdge = (edgeID) => {
      delete edge.ids[edgeID];
      delete edge.sources[edgeID];
      delete edge.targets[edgeID];
    };

    /**
     * Finds the first existing edge between the given source and target.
     * @param {string} source A source node ID
     * @param {string} target A target node ID
     * @returns {?string} An edge ID if found, otherwise undefined
     */
    const findEdgeBetween = (source, target) =>
      Object.keys(edge.ids).find(
        (edgeID) =>
          edge.sources[edgeID] === source && edge.targets[edgeID] === target
      );

    /**
     * If there is an edge between the same nodes in the reverse direction to the new edge,
     * then this function will delete one of the two edges to avoid forming a cycle in the graph.
     * To decide which edge gets dropped, the Kedro specific simplifcation strategy is
     * to keep the edge where the source is a modular pipeline node, otherwise just keep the new edge.
     * @param {string} newEdgeID An edge ID
     * @returns {string} The resulting edge ID
     */
    const deleteCyclicEdge = (newEdgeID) => {
      // Find first edge between these nodes but in the reverse direction (target to source)
      const reverseEdgeID = findEdgeBetween(
        edge.targets[newEdgeID],
        edge.sources[newEdgeID]
      );

      // If a reverse edge was found, then handle the cycle (as described in this function description)
      if (reverseEdgeID) {
        const sourceIsPipeline =
          node.type[edge.sources[newEdgeID]] === 'pipeline';

        // Keep the edge where the source is a modular pipeline node, otherwise just keep the new edge
        deleteEdge(sourceIsPipeline ? reverseEdgeID : newEdgeID);
      }
    };

    /**
     * When deleting nodes, delete any edges that linked to/from those nodes,
     * and replace them with new edges that link to/from the new node.
     * @param {string} nodeID The ID of the new node
     * @param {array} deletedNodes The ID(s) of old nodes that are being deleted
     */
    const redirectEdges = (nodeID, deletedNodes = []) => {
      const { sources, targets } = edge;
      Object.keys(edge.ids).forEach((edgeID) => {
        if (deletedNodes.includes(targets[edgeID])) {
          // Redirect incoming edges:
          addEdge(sources[edgeID], nodeID);
          deleteEdge(edgeID);
        } else if (deletedNodes.includes(sources[edgeID])) {
          // Redirect outgoing edges:
          addEdge(nodeID, targets[edgeID]);
          deleteEdge(edgeID);
        }
      });
    };

    /**
     * Select all nodes which are children of a contracted modular pipeline,
     * and replace them with new nodes which bear the modular pipeline's name
     * @param {string} modPipID Modular pipeline ID
     */
    const replaceModularPipelineNodes = (modPipID) => {
      const children = modularPipelineChildren[modPipID];
      Object.keys(node.ids).forEach((nodeID) => {
        if (children[nodeID]) {
          deleteNode(nodeID);
          const newNodeID = addNode(modPipID, nodeID);
          redirectEdges(newNodeID, [nodeID]);
        }
      });
    };

    /**
     * Find an edge whose source and target both belong to the modular pipeline
     * @param {*} modPipID Modular pipeline ID
     * @returns {string|undefined} An edge ID, or undefined
     */
    const findModPipEdge = (modPipID) => {
      const children = modularPipelineChildren[modPipID];

      /**
       * Determine whether a node is a child of the modular pipeline,
       * or if it is a modular pipeline node created for this MP:
       * @param {string} nodeID A node's ID
       * @returns {boolean} True if the node belongs to the modular pipeline
       */
      const belongsToModPip = (nodeID) =>
        children[nodeID] || node.modularPipeline[nodeID] === modPipID;

      return Object.keys(edge.ids).find(
        (edgeID) =>
          belongsToModPip(edge.sources[edgeID]) &&
          belongsToModPip(edge.targets[edgeID])
      );
    };

    /**
     * Find an edge which has source and target nodes which are both part of
     * the collapsed modular pipeline, and collapse the edge, merging the source
     * and target together into a single new node. Run this process recursively
     * until there are no edges left to collapse for this modular pipeline.
     * @param {string} modPipID Modular pipeline ID
     */
    const collapseEdges = (modPipID) => {
      const edgeID = findModPipEdge(modPipID);
      if (!edgeID) {
        return;
      }
      const source = edge.sources[edgeID];
      const target = edge.targets[edgeID];
      const newNodeID = addNode(modPipID, source);
      deleteNode(source);
      deleteNode(target);
      deleteEdge(edgeID);
      redirectEdges(newNodeID, [source, target]);
      collapseEdges(modPipID);
    };

    const contractedModularPipelines = modularPipelineIDs.filter(
      (id) => modularPipelineContracted[id]
    );
    for (const modPipID of contractedModularPipelines) {
      // Collapse edges that link from a modular pipeline to itself:
      collapseEdges(modPipID);
      // Replace single nodes that belong to a modular pipeline:
      replaceModularPipelineNodes(modPipID);
    }

    return {
      edge: { ...edge, ids: Object.keys(edge.ids) },
      node: { ...node, ids: Object.keys(node.ids) },
    };
  }
);

/**
 * Get only the visible edges, and format as an array of objects
 */
export const getVisibleEdges = createSelector(
  [getContractedModularPipelines],
  ({ edge }) =>
    edge.ids.map((id) => ({
      id,
      source: edge.sources[id],
      target: edge.targets[id],
    }))
);

/**
 * Get a list of just the IDs for the remaining visible layers
 */
export const getVisibleLayerIDs = createSelector(
  [getContractedModularPipelines, getNodeLayer, getLayerIDs, getLayersVisible],
  ({ node }, nodeLayer, layerIDs, layersVisible) => {
    if (!layersVisible) {
      return [];
    }
    const visibleLayerIDs = {};
    for (const nodeID of node.ids) {
      visibleLayerIDs[nodeLayer[nodeID]] = true;
    }
    return layerIDs.filter((layerID) => visibleLayerIDs[layerID]);
  }
);
