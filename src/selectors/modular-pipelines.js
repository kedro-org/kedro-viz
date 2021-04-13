import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';

const getModularPipelineIDs = (state) => state.modularPipeline.ids;
const getNodeIDs = (state) => state.node.ids;
const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;

/**
 * Get all the nodes in each modular pipeline
 */
export const getModularPipelineChildren = createSelector(
  [getModularPipelineIDs, getNodeIDs, getNodeModularPipelines],
  (modularPipelineIDs, nodeIDs, nodeModularPipelines) => {
    const modPipNodes = arrayToObject(modularPipelineIDs, () => ({}));
    nodeIDs.forEach((nodeID) => {
      nodeModularPipelines[nodeID]?.forEach((modPipID) => {
        if (!modPipNodes[modPipID]) {
          modPipNodes[modPipID] = {};
        }
        modPipNodes[modPipID][nodeID] = true;
      });
    });
    return modPipNodes;
  }
);

/**
 * Get a list of input/output edges of visible modular pipeline pseudo-nodes
 * by examining the edges of their childen
 */
export const getModularPipelineEdges = createSelector(
  [
    getModularPipelineIDs,
    getModularPipelineChildren,
    getEdgeIDs,
    getEdgeSources,
    getEdgeTargets,
  ],
  (
    modularPipelineIDs,
    modularPipelineChildren,
    edgeIDs,
    edgeSources,
    edgeTargets
  ) => {
    const modPipEdges = {
      ids: [],
      modPip: {},
      sources: {},
      targets: {},
    };
    const addNewEdge = (source, target, modPipID) => {
      const id = [source, target].join('|');
      modPipEdges.ids.push(id);
      modPipEdges.sources[id] = source;
      modPipEdges.targets[id] = target;
      modPipEdges.modPip[id] = modPipID;
    };
    modularPipelineIDs.forEach((modPipID) => {
      const modPipNodes = modularPipelineChildren[modPipID];
      edgeIDs.forEach((edgeID) => {
        const source = edgeSources[edgeID];
        const target = edgeTargets[edgeID];
        if (modPipNodes[target] && !modPipNodes[source]) {
          // input edge
          addNewEdge(source, modPipID, modPipID);
        } else if (modPipNodes[source] && !modPipNodes[target]) {
          // output edge
          addNewEdge(modPipID, target, modPipID);
        }
      });
    });
    return modPipEdges;
  }
);
