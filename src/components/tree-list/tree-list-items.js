import { createSelector } from 'reselect';
import { arrayToObject } from '../../utils';

const getModularPipelineIDs = (state) => state.modularPipeline.ids;
const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;
const getNodesModularPipelines = (state) => state.node.modularPipelines;
const getNodeNames = (state) => state.node.name;
const getNodeTypes = (state) => state.node.type;

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
 * Constructs a set of nodes items needed for the sidebar
 * @param {object} itemA First item to compare
 * @param {object} itemB Second item to compare
 * @return {number} Comparison result
 */
//  export const getNodeItems = createSelector(
//     [(state) => state.node, (state) => state.nodeSelected, (state) => ],
//     (nodes, nodeSelected) => {
//       const result = {};

//     //   return {
//     //     ...node,
//     //     visibleIcon: VisibleIcon,
//     //     invisibleIcon: InvisibleIcon,
//     //     active: undefined,
//     //     selected: nodeSelected[node.id],
//     //     faded: node.disabled_node || disabled,
//     //     visible: !disabled && checked,
//     //     unset: false,
//     //     checked,
//     //     disabled,
//     //   };

//       return result;
//     }
//   );

/**
 * returns an array of modular pipelines with the corresponding
 * nodes for each modular pipeline
 */
export const getModularPipelineNodes = createSelector(
  [
    getNodesModularPipelines,
    getModularPipelineIDs,
    getNodeNames,
    getNodeTypes,
    (state) => state.nodes,
  ],
  (allNodes, modularPipelinesIDs, nodeNames, nodeTypes, nodes) => {
    const modularPipelineNodes = arrayToObject(modularPipelinesIDs, () => []);
    console.log('nodes', nodes);

    // create a new field for the topmost / root pipeline
    modularPipelineNodes['main'] = [];

    // go through set of nodes first to identify root level nodes
    Object.keys(allNodes).forEach((key) => {
      if (allNodes[key].length === 0) {
        modularPipelineNodes.main.push({
          id: key,
          name: nodeNames[key],
          type: nodeTypes[key],
        });
        delete allNodes[key];
      }
    });

    // go through the set of nodes and slot them into the corresponding modular pipeline array
    Object.keys(modularPipelineNodes).forEach((modularPipeline) => {
      Object.keys(allNodes).forEach(
        (key) =>
          allNodes[key].includes(modularPipeline) &&
          modularPipelineNodes[modularPipeline].push({
            id: key,
            name: nodeNames[key],
            type: nodeTypes[key],
          })
      );
    });

    return modularPipelineNodes;
  }
);

/**
 * returns an array of modular pipelines arranged in a nested structure with corresponding nodes and names
 */
export const getNestedModularPipelines = createSelector(
  [
    getModularPipelineIDs,
    getModularPipelineNodes,
    getModularPipelineName,
    getModularPipelineEnabled,
  ],
  (
    modularPipelineIDs,
    modularPipelineNodes,
    modularPipelinesNames,
    modularPipelineEnabled
  ) => {
    // go through modular pipeline ids to return nested data structure
    const mainTree = {
      nodes: modularPipelineNodes.main,
      children: [],
      name: 'main',
      id: 'main',
      enabled: true,
      type: 'modularpipeline',
    };
    let level = 1; // this keeps track of how far you are down in the nested pipeline
    let currentParent = mainTree;
    modularPipelineIDs.forEach((id) => {
      let currentLevel = id.split('.').length;

      // determine the current parent and update level
      if (currentLevel > level) {
        // look for the parent modular pipeline in the new lower level
        let i = id.lastIndexOf('.');
        const parent = id.substr(0, i);
        // update the current parent to a new lower level
        currentParent = currentParent.children.filter(
          (mp) => mp.id === parent
        )[0];
        level = currentLevel;
      } else if (currentLevel === 1) {
        // update the current parent back to the top parent
        level = 1;
        currentParent = mainTree;
      }

      // add in the new level and nodes
      currentParent.children.push({
        id,
        name: modularPipelinesNames[id],
        enabled: modularPipelineEnabled[id],
        nodes: modularPipelineNodes[id],
        children: [],
        type: 'modularpipeline',
      });
      //update current level
      level = currentLevel;
    });
    return mainTree;
  }
);
