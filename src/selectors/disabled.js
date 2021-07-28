import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getNodeDisabledPipeline, getPipelineNodeIDs } from './pipeline';
import { getTagCount } from './tags';
import {
  getModularPipelineCount,
  getFocusedModularPipelines,
} from './modular-pipelines';

const getNodeIDs = (state) => state.node.ids;
const getNodeDisabledNode = (state) => state.node.disabled;
const getNodeTags = (state) => state.node.tags;
const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getNodeType = (state) => state.node.type;
const getTagEnabled = (state) => state.tag.enabled;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;
const getNodeTypeDisabled = (state) => state.nodeType.disabled;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getLayerIDs = (state) => state.layer.ids;
const getLayersVisible = (state) => state.layer.visible;
const getNodeLayer = (state) => state.node.layer;

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledTag = createSelector(
  [getNodeIDs, getTagEnabled, getTagCount, getNodeTags],
  (nodeIDs, tagEnabled, tagCount, nodeTags) =>
    arrayToObject(nodeIDs, (nodeID) => {
      if (tagCount.enabled === 0) {
        return false;
      }
      if (nodeTags[nodeID].length) {
        // Hide task nodes that don't have at least one tag filter enabled
        return !nodeTags[nodeID].some((tag) => tagEnabled[tag]);
      }
      return true;
    })
);

const isNodeOfActiveModularPipeline = (
  nodeModularPipelines,
  nodeID,
  modularPipelineEnabled
) =>
  nodeModularPipelines[nodeID].some(
    (modularPipeline) => modularPipelineEnabled[modularPipeline]
  );

/**
 * Calculate whether nodes should be disabled based on their modular pipelines,
 * except related dataset nodes and
 */
export const getNodeDisabledModularPipeline = createSelector(
  [
    getNodeIDs,
    getModularPipelineEnabled,
    getModularPipelineCount,
    getNodeModularPipelines,
    getEdgeIDs,
    getNodeType,
    getEdgeSources,
    getEdgeTargets,
  ],
  (
    nodeIDs,
    modularPipelineEnabled,
    modularPipelineCount,
    nodeModularPipelines,
    edgeIDs,
    nodeType,
    edgeSources,
    edgeTargets
  ) =>
    arrayToObject(nodeIDs, (nodeID) => {
      if (modularPipelineCount.enabled === 0) {
        return false;
      }
      // check to see whether the node itself belongs to a modular pipeline
      // if (nodeModularPipelines[nodeID].length) {
      if (nodeID === '1161a87b') {
        console.log('found output');
      }

      if (nodeID === '6d5873ac') {
        console.log('found input');
      }
      // check if the node belongs to the selected modular pipeline first
      if (
        !isNodeOfActiveModularPipeline(
          nodeModularPipelines,
          nodeID,
          modularPipelineEnabled
        ) &&
        (nodeType[nodeID] === 'parameters' || nodeType[nodeID] === 'data')
      ) {
        // check if the node points to a target that belongs to a modular pipeline
        // obtain the edgeID first
        const relatedEdgeIDs = edgeIDs.filter((edgeID) =>
          edgeID.includes(nodeID)
        );

        if (nodeID === '6d5873ac' || nodeID === '1161a87b') {
          console.log('relatedEdgeID', relatedEdgeIDs);
        }

        let containMPEdge = false;

        // check amongst all the relatedEdgeIDs to see if any of them fulfills
        relatedEdgeIDs.map((relatedEdgeID) => {
          // obtain the source and target
          const source = edgeSources[relatedEdgeID];
          const target = edgeTargets[relatedEdgeID];

          const isInput =
            source === nodeID &&
            isNodeOfActiveModularPipeline(
              nodeModularPipelines,
              target,
              modularPipelineEnabled
            );

          if (nodeID === '6d5873ac') {
            console.log('target', target);
            console.log(
              'check target',
              isNodeOfActiveModularPipeline(
                nodeModularPipelines,
                target,
                modularPipelineEnabled
              )
            );
            console.log('isInput', isInput);
          }

          const isOutput =
            target === nodeID &&
            isNodeOfActiveModularPipeline(
              nodeModularPipelines,
              source,
              modularPipelineEnabled
            );

          if (nodeID === '1161a87b') {
            console.log(
              'check source',
              isNodeOfActiveModularPipeline(
                nodeModularPipelines,
                source,
                modularPipelineEnabled
              )
            );
            console.log('isOutput', isOutput);
          }

          // check if the target node belongs to a enabled modualr pipeline
          if (isInput || (isOutput && containMPEdge === false)) {
            containMPEdge = true;
          }

          return !containMPEdge;
        });
      }

      // go through dataset and parameter nodes to identify the nodes that are
      // if node is dataset or parameter, and is not part of a enabled mp
      // check the target and see if it points to a point that has an enabled pipeline

      // Hide nodes that don't have at least one modular pipeline filter enabled
      return !isNodeOfActiveModularPipeline(
        nodeModularPipelines,
        nodeID,
        modularPipelineEnabled
      );
      // }
      // return true;
    })
);

// /**
//  * Returns input nodes that are related to
//  */
// export const getInputNodesInFocusedModularPipeline = createSelector(
//   [
//     getNodeModularPipelines,
//     getEdgeIDs,
//     getNodeType,
//     getEdgeSources,
//     getEdgeTargets,
//     getFocusedModularPipelines,
//     getNodeDisabledNode,
//     getNodeDisabledTag,
//     getNodeDisabledModularPipeline,
//     getNodeTypeDisabled,
//   ],
//   (
//     modularPipelineNodes,
//     edgeIDs,
//     nodeType,
//     edgeSources,
//     edgeTargets,
//     focusedModularPipelines,
//     nodeDisabledNode,
//     nodeDisabledTag,
//     nodeDisabledModularPipeline,
//     nodeTypeDisabled
//   ) => {
//     const nodesList = {};

//     console.log('modularPipelineNodes', modularPipelineNodes);
//     console.log('nodeDisabledModularPipeline', nodeDisabledModularPipeline);

//     // if (focusedModularPipelines !== null) {
//     //   // loop through current nodeDisabledModularPipelines first to identify the disabled dataset nodes

//     //   nodeDisabledModularPipeline.map((node) => {
//     //     if (node.type === 'dataset' || node.type === 'parameters') {
//     //       const source = edgeSources[node.id];
//     //       const target = edgeTargets[node.id];

//     //       // check edge target nodes

//     //       if (nodeType[target] === 'task') {
//     //       }
//     //     }
//     //   });

//     //   // further check if this node is within nodeDisabled, nodeDisabledNode, nodeDisabledTag, etc
//     //   return nodesList;
//     // }
//     return nodesList;
//   }
// );

/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view/type/modularPipeline
 */
export const getNodeDisabled = createSelector(
  [
    getNodeIDs,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledModularPipeline,
    getNodeDisabledPipeline,
    getNodeType,
    getNodeTypeDisabled,
    // getInputNodesInFocusedModularPipeline // this is needed to take out from the final set of disabled nodes
  ],
  (
    nodeIDs,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledModularPipeline,
    nodeDisabledPipeline,
    nodeType,
    typeDisabled
  ) => {
    console.log('nodeDisabledModularPipeline', nodeDisabledModularPipeline);
    return arrayToObject(nodeIDs, (id) =>
      [
        nodeDisabledNode[id],
        nodeDisabledTag[id],
        nodeDisabledModularPipeline[id],
        nodeDisabledPipeline[id],
        typeDisabled[nodeType[id]],
      ].some(Boolean)
    );
  }
);

/**
 * Get a list of just the IDs for the remaining visible nodes
 */
export const getVisibleNodeIDs = createSelector(
  [getPipelineNodeIDs, getNodeDisabled],
  (nodeIDs, nodeDisabled) => nodeIDs.filter((id) => !nodeDisabled[id])
);

/**
 * Get a list of just the IDs for the remaining visible layers
 */
export const getVisibleLayerIDs = createSelector(
  [getVisibleNodeIDs, getNodeLayer, getLayerIDs, getLayersVisible],
  (nodeIDs, nodeLayer, layerIDs, layersVisible) => {
    if (!layersVisible) {
      return [];
    }
    const visibleLayerIDs = {};
    for (const nodeID of nodeIDs) {
      visibleLayerIDs[nodeLayer[nodeID]] = true;
    }
    return layerIDs.filter((layerID) => visibleLayerIDs[layerID]);
  }
);

/**
 * Determine whether an edge should be disabled based on their source/target nodes
 */
export const getEdgeDisabled = createSelector(
  [getEdgeIDs, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (edgeIDs, nodeDisabled, edgeSources, edgeTargets) =>
    arrayToObject(edgeIDs, (edgeID) => {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      return Boolean(nodeDisabled[source] || nodeDisabled[target]);
    })
);
