import {
  TOGGLE_MODULAR_PIPELINE_ACTIVE,
  TOGGLE_MODULAR_PIPELINE_EXPANDED,
} from '../actions/modular-pipelines';

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
      // for (const expandedID of action.expandedIDs) {
      //   const chunks = expandedID.split('.');
      //   let i = 0;
      //   let prefix = [];
      //   let isParentVisible = true;
      //   while (i < chunks.length - 1) {
      //     prefix.push(chunks[i]);
      //     if (!newState.visible[prefix.join('.')]) {
      //       isParentVisible = false;
      //       break;
      //     }
      //     i++;
      //   }

      //   if (isParentVisible) {
      //     newState.visible[expandedID] = true;
      //   }
      // }
      const isExpanding =
        action.expandedIDs.length > modularPipelineState.expanded.length;

      if (isExpanding) {
        const expandedModularPipeline = action.expandedIDs.filter(
          (expandedID) => !modularPipelineState.expanded.includes(expandedID)
        )[0];
        newVisibleState[expandedModularPipeline] = false;
        modularPipelineState.tree[expandedModularPipeline].children.forEach(
          (child) => (newVisibleState[child.id] = true)
        );
      } else {
        const collapsedModularPipeline = modularPipelineState.expanded.filter(
          (expandedID) => !action.expandedIDs.includes(expandedID)
        )[0];
        newVisibleState[collapsedModularPipeline] = true;
        modularPipelineState.tree[collapsedModularPipeline].children.forEach(
          (child) => (newVisibleState[child.id] = false)
        );
      }
      console.log(newVisibleState);

      return updateState({
        expanded: action.expandedIDs,
        visible: newVisibleState,
      });
    }

    default:
      return modularPipelineState;
  }
}

export default modularPipelineReducer;
