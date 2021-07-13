import { createSelector } from 'reselect';
import { getPipelineModularPipelineIDs } from './pipeline';
import { arrayToObject } from '../utils';

export const getModularPipelineIDs = (state) => state.modularPipeline.ids;
const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;
const getModularPipelineContracted = (state) =>
  state.modularPipeline.contracted;
const getNodeIDs = (state) => state.node.ids;
const getNodeModularPipelines = (state) => state.node.modularPipelines;

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
 * List all the child nodes in each modular pipeline
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
 * List all the parent modular pipelines for a given modular pipeline.
 * This assumes that IDs of modular pipelines contain their full path with
 * dot separators, e.g. foo.bar.baz is the child of foo.bar and foo.
 */
export const getModularPipelineParents = createSelector(
  [getModularPipelineIDs],
  (modularPipelineIDs) =>
    arrayToObject(modularPipelineIDs, (modPipID) =>
      modPipID
        .split('.')
        .map((part, i, parts) => parts.slice(0, i).join('.'))
        .slice(1)
    )
);

/**
 * Set disabled status if the node is specifically hidden,
 * and/or via a tag/view/type/modularPipeline
 */
export const getModularPipelineParentsContracted = createSelector(
  [
    getModularPipelineIDs,
    getModularPipelineParents,
    getModularPipelineContracted,
  ],
  (modularPipelineIDs, modularPipelineParents, modularPipelineContracted) =>
    arrayToObject(modularPipelineIDs, (modPipID) =>
      modularPipelineParents[modPipID].some(
        (id) => modularPipelineContracted[id]
      )
    )
);

/**
 * Retrieve the formatted list of modular pipeline filters
 */
export const getModularPipelineData = createSelector(
  [
    getPipelineModularPipelineIDs,
    getModularPipelineName,
    getModularPipelineEnabled,
    getModularPipelineContracted,
    getModularPipelineParentsContracted,
  ],
  (
    modularPipelineIDs,
    modularPipelineName,
    modularPipelineEnabled,
    modularPipelineContracted,
    modularPipelineParentsContracted
  ) =>
    modularPipelineIDs
      .slice()
      .sort()
      .map((id) => ({
        id,
        name: modularPipelineName[id],
        contracted: Boolean(
          modularPipelineParentsContracted[id] || modularPipelineContracted[id]
        ),
        disabled: Boolean(modularPipelineParentsContracted[id]),
        enabled: Boolean(modularPipelineEnabled[id]),
      }))
);
