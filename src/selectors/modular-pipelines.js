import { createSelector } from 'reselect';

const getNodesModularPipelines = (state) => state.node.modularPipelines;
const getModularPipelines = (state) => state.modularPipeline.ids;

/**
 * returns an array of modular pipelines with the corresponding
 * nodes for each modular pipeline
 */
export const getModularPipelineNodes = createSelector(
  [getNodesModularPipelines, getModularPipelines],
  (allNodes, modularPipelines) => {
    return modularPipelines.map((modularPipeline) => {
      let nodes = [];
      Object.keys(allNodes).map((key) =>
        allNodes[key]
          ? allNodes[key].includes(modularPipeline) && nodes.push(key)
          : null
      );
      return {
        modularPipeline,
        nodes,
      };
    });
  }
);
