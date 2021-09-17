import { createSelector } from 'reselect';
import { getPipelineModularPipelineIDs } from './pipeline';

export const getModularPipelineIDs = (state) => state.modularPipeline.ids;
export const getModularPipelineTree = (state) => state.modularPipeline.tree;
export const getFocusedModularPipeline = (state) =>
  state.visible.modularPipelineFocusMode;
const getModularPipelineName = (state) => state.modularPipeline.name;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;
const getModularPipelineChildren = (state) => state.modularPipeline.children;
const getPrettyName = (state) => state.prettyName;

// /**
//  * Retrieve the formatted list of modular pipeline filters
//  */
export const getModularPipelineData = createSelector(
  [
    getModularPipelineIDs,
    getModularPipelineTree,
    // getModularPipelineName,
    // getModularPipelineEnabled,
    // getModularPipelineChildren,
    // getPrettyName,
  ],
  (
    modularPipelineIDs,
    modularPipelineTree
    // modularPipelineName,
    // modularPipelineEnabled,
    // modularPipelineChildren,
    // prettyName
  ) => {
    return modularPipelineIDs
      .slice()
      .sort()
      .map((id) => ({
        id,
        // name: prettyName ? modularPipelineName[id] : id,
        name: modularPipelineTree[id].name,
        // enabled: Boolean(modularPipelineEnabled[id]),
        enabled: true,
        children: modularPipelineTree[id].children,
      }));
  }
);

/**
 * Get the total and enabled number of modular pipelines
 */
// export const getModularPipelineCount = createSelector(
//   [getPipelineModularPipelineIDs, getModularPipelineEnabled],
//   (modularPipelineIDs, modularPipelineEnabled) => ({
//     total: modularPipelineIDs.length,
//     enabled: modularPipelineIDs.filter((id) => modularPipelineEnabled[id])
//       .length,
//   })
// );
