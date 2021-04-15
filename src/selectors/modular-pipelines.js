import { createSelector } from 'reselect';
import { getPipelineModularPipelineIDs } from './pipeline';
import { arrayToObject } from '../utils';

const getNodesModularPipelines = (state) => state.node.modularPipelines;
const getModularPipelineIDs = (state) => state.modularPipeline.ids;
const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;
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

/**
 * Retrieve the formatted list of modular pipeline filters
 */
export const getModularPipelineData = createSelector(
  [getModularPipelineIDs, getModularPipelineName, getModularPipelineEnabled],
  (modularPipelineIDs, modularPipelineName, modularPipelineEnabled) =>
    modularPipelineIDs
      .slice()
      .sort()
      .map((id) => ({
        id,
        name: modularPipelineName[id],
        enabled: Boolean(modularPipelineEnabled[id]),
      }))
);

/**
 * Get the total and enabled number of modular pipelines
 */
export const getModularPipelineCount = createSelector(
  [getPipelineModularPipelineIDs, getModularPipelineEnabled],
  (modularPipelineIDs, modularPipelineEnabled) => ({
    total: modularPipelineIDs.length,
    enabled: modularPipelineIDs.filter((id) => modularPipelineEnabled[id])
      .length,
  })
);

/**
 * returns an array of modular pipelines with the corresponding
 * nodes for each modular pipeline
 */
export const getModularPipelineNodes = createSelector(
  [getNodesModularPipelines, getModularPipelineIDs],
  (allNodesModularPipelines, modularPipelines) => {
    return modularPipelines.map((modularPipeline) => {
      let nodes = [];
      Object.keys(allNodesModularPipelines).forEach((key) => {
        if (
          allNodesModularPipelines[key] &&
          allNodesModularPipelines[key].includes(modularPipeline)
        )
          nodes.push(key);
      });
      return {
        modularPipeline,
        nodes,
      };
    });
  }
);
