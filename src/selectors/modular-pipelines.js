import { createSelector } from 'reselect';

const getNodesModularPipelines = (state) => state.node.modularPipelines;
const getModularPipelineIDs = (state) => state.modularPipeline.ids;
const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;

/**
 * Retrieve the formatted list of tag filters
 */
export const getModularPipelineData = createSelector(
  [getModularPipelineIDs, getModularPipelineName, getModularPipelineEnabled],
  (modularPipelineIDs, modularPipelineName, modularPipelineEnabled) =>
    modularPipelineIDs.sort().map((id) => ({
      id,
      name: modularPipelineName[id],
      enabled: Boolean(modularPipelineEnabled[id]),
    }))
);

/**
 * returns an array of modular pipelines with the corresponding
 * nodes for each modular pipeline
 */
export const getModularPipelineNodes = createSelector(
  [getNodesModularPipelines, getModularPipelineIDs],
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
