import {
  TOGGLE_MODULAR_PIPELINE_ACTIVE,
  TOGGLE_MODULAR_PIPELINE_EXPANDED,
} from '../actions/modular-pipelines';

// mark a tree as invisible from a node downwards
const markTreeInvisible = (tree, node, result) => {
  tree[node].children.forEach((child) => {
    result[child.id] = false;
    if (child.type === 'modularPipeline') {
      markTreeInvisible(tree, child.id, result);
    }
  });
};

function modularPipelineReducer(modularPipelineState = {}, action) {
  const updateState = (newState) =>
    Object.assign({}, modularPipelineState, newState);

  /**
   * Batch update tags from an array of tag IDs
   * @param {string} key Tag action value prop
   */
  const batchChanges = (key) =>
    action.modularPipelineIDs.reduce((result, modularPipelineID) => {
      result[modularPipelineID] = action[key];
      return result;
    }, {});

  switch (action.type) {
    case TOGGLE_MODULAR_PIPELINE_ACTIVE: {
      return updateState({
        active: Object.assign(
          {},
          modularPipelineState.active,
          batchChanges('active')
        ),
      });
    }
    case TOGGLE_MODULAR_PIPELINE_EXPANDED: {
      const newVisibleState = { ...modularPipelineState.visible };
      const isExpanding =
        action.expandedIDs.length > modularPipelineState.expanded.length;
      let expandedIDs = action.expandedIDs;

      if (isExpanding) {
        const expandedModularPipelines = expandedIDs.filter(
          (expandedID) => !modularPipelineState.expanded.includes(expandedID)
        );
        expandedModularPipelines.forEach((expandedModularPipeline) => {
          newVisibleState[expandedModularPipeline] = false;
          modularPipelineState.tree[expandedModularPipeline].children.forEach(
            (child) => (newVisibleState[child.id] = true)
          );
        });
      } else {
        const collapsedModularPipelines = modularPipelineState.expanded.filter(
          (expandedID) => !expandedIDs.includes(expandedID)
        );
        collapsedModularPipelines.forEach((collapsedModularPipeline) => {
          newVisibleState[collapsedModularPipeline] = true;
          markTreeInvisible(
            modularPipelineState.tree,
            collapsedModularPipeline,
            newVisibleState
          );
          expandedIDs = expandedIDs.filter(
            (id) => !id.startsWith(collapsedModularPipeline)
          );
        });
      }

      return updateState({
        expanded: expandedIDs,
        visible: newVisibleState,
      });
    }

    default:
      return modularPipelineState;
  }
}

export default modularPipelineReducer;
