import { createSelector } from 'reselect';
import { getPipelineNodeIDs, getPipelineModularPipelineIDs } from './pipeline';
import { getModularPipelineChildren } from './modular-pipelines';
import { arrayToObject } from '../utils';

const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineContracted = (state) =>
  state.modularPipeline.contracted;
const getNodeName = (state) => state.node.name;
const getNodeFullName = (state) => state.node.fullName;
const getNodeType = (state) => state.node.type;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;

/**
 * Collapse modular pipelines by replacing standalone MP children with MP nodes,
 * and collapsing edges that link from a modular pipeline's node to itself.
 */
export const getContractedModularPipelines = createSelector(
  [
    getPipelineModularPipelineIDs,
    getModularPipelineChildren,
    getModularPipelineContracted,
    getModularPipelineName,
    getPipelineNodeIDs,
    getNodeName,
    getNodeFullName,
    getNodeType,
    getEdgeIDs,
    getEdgeSources,
    getEdgeTargets,
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
    edgeIDs,
    edgeSource,
    edgeTarget
  ) => {
    // List of nodes, but converting the IDs to an object to improve performance
    const node = {
      ids: arrayToObject(nodeIDs, () => true),
      name: { ...nodeName },
      fullName: { ...nodeFullName },
      type: { ...nodeType },
      modularPipeline: {},
    };

    // List of edges, but converting the IDs to an object to improve performance
    const edge = {
      ids: arrayToObject(edgeIDs, () => true),
      sources: { ...edgeSource },
      targets: { ...edgeTarget },
    };

    /**
     * Add a new node to replace existing node(s)
     * @param {string} modPipID Modular pipeline ID
     * @param {string} uid A node/edge ID, to ensure uniqueness
     * @returns {string} The ID for the new node
     */
    const addNode = (modPipID, uid) => {
      const nodeID = [modPipID, uid].join('-');
      node.ids[nodeID] = true;
      node.name[nodeID] = modularPipelineName[modPipID];
      node.fullName[nodeID] = modPipID;
      node.type[nodeID] = 'pipeline';
      node.modularPipeline[nodeID] = modPipID;
      return nodeID;
    };

    const deleteNode = (nodeID) => {
      delete node.ids[nodeID];
    };

    const addEdge = (source, target) => {
      const edgeID = [source, target].join('|');
      edge.ids[edgeID] = true;
      edge.sources[edgeID] = source;
      edge.targets[edgeID] = target;
      return edgeID;
    };

    const deleteEdge = (id) => {
      delete edge.ids[id];
      delete edge.sources[id];
      delete edge.targets[id];
    };

    const redirectEdges = (nodeID, connectedNodes = []) => {
      const { sources, targets } = edge;
      Object.keys(edge.ids).forEach((edgeID) => {
        if (connectedNodes.includes(targets[edgeID])) {
          // Redirect incoming edges:
          addEdge(sources[edgeID], nodeID);
          deleteEdge(edgeID);
        } else if (connectedNodes.includes(sources[edgeID])) {
          // Redirect outgoing edges:
          addEdge(nodeID, targets[edgeID]);
          deleteEdge(edgeID);
        }
      });
    };

    const replaceModPipNodes = (modPipID) => {
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
     * Find an edge which has source and target nodes which are both part of
     * the collapsed modular pipeline, and collapse the edge, merging the source
     * and target together into a single new node. Run this process recursively
     * until there are no edges left to collapse for this modular pipeline.
     * @param {string} modPipID Modular pipeline ID
     */
    const collapseEdges = (modPipID) => {
      const children = modularPipelineChildren[modPipID];

      // Returns true if a node is a child of the modular pipeline, or
      // if it is a modular pipeline node created for this MP:
      const belongsToModPip = (nodeID) =>
        children[nodeID] || node.modularPipeline[nodeID] === modPipID;

      // Find an edge whose source and target both belong to the MP
      const edgeID = Object.keys(edge.ids).find(
        (edgeID) =>
          belongsToModPip(edge.sources[edgeID]) &&
          belongsToModPip(edge.targets[edgeID])
      );

      if (!edgeID) {
        return;
      }

      const newNodeID = addNode(modPipID, edgeID);
      const source = edge.sources[edgeID];
      const target = edge.targets[edgeID];
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
      replaceModPipNodes(modPipID);
    }

    return {
      edge: { ...edge, ids: Object.keys(edge.ids) },
      node: { ...node, ids: Object.keys(node.ids) },
    };
  }
);
