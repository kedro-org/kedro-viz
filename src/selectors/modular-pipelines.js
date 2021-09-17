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
    getPrettyName,
  ],
  (modularPipelineIDs, modularPipelineTree, prettyName) => {
    return modularPipelineIDs
      .slice()
      .sort()
      .map((id) => ({
        id,
        name: prettyName ? modularPipelineTree[id].name : id,
        // enabled: Boolean(modularPipelineEnabled[id]),
        enabled: true,
        children: modularPipelineTree[id].children,
      }));
  }
);
