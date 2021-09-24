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
      return updateState({
        expanded: action.expandedIDs,
      });
    }

    default:
      return modularPipelineState;
  }
}

export default modularPipelineReducer;
