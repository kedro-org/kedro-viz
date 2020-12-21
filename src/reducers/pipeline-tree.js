// import { UPDATE_ACTIVE_PIPELINE } from '../actions/pipelines';
import { CHECK_TREE_NODE, EXPAND_TREE_NODE } from '../actions/pipeline-tree';

function pipelineTreeReducer(pipelineTreeState = {}, action) {
  const updateState = newState =>
    Object.assign({}, pipelineTreeState, newState);
  switch (action.type) {
    // case UPDATE_ACTIVE_PIPELINE: {
    //   return updateState({active: action.pipeline});
    // }

    case CHECK_TREE_NODE: {
      return updateState({ checked: action.checked });
    }

    case EXPAND_TREE_NODE: {
      return updateState({ expanded: action.expanded });
    }

    default:
      return pipelineTreeState;
  }
}

export default pipelineTreeReducer;
