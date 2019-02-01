import {
  CHANGE_ACTIVE_PIPELINE,
  CHANGE_VIEW,
  DELETE_SNAPSHOT,
  RESET_SNAPSHOT_DATA,
  TOGGLE_PARAMETERS,
  TOGGLE_TEXT_LABELS,
  UPDATE_NODE_PROPERTIES,
} from '../actions';
import updateNodeProperties from './updateNodeProperties';

function reducer(state = {}, action) {
  switch (action.type) {
    case CHANGE_ACTIVE_PIPELINE:
      return Object.assign({}, state, {
        activePipelineData: action.pipeline
      });
    case CHANGE_VIEW:
      return Object.assign({}, state, {
        view: action.view,
      });
    case DELETE_SNAPSHOT: {
      if (state.onDeleteSnapshot) {
        state.onDeleteSnapshot(action.id);
        return state;
      }
      return Object.assign({}, state, {
        pipelineData: state.pipelineData.filter(d => d.kernel_ai_schema_id !== action.id)
      });
    }
    case RESET_SNAPSHOT_DATA: 
      return Object.assign({}, state, {
        activePipelineData: action.snapshots[0],
        pipelineData: action.snapshots,
      });
    case TOGGLE_TEXT_LABELS:
      return Object.assign({}, state, {
        textLabels: action.textLabels,
      });
    case TOGGLE_PARAMETERS:
      return Object.assign({}, state, {
        activePipelineData: updateNodeProperties({
          pipelineData: state.activePipelineData,
          matchNode: node => node.name.includes('param'),
          property: 'disabled',
          value: !action.parameters
        }),
        parameters: action.parameters,
      });
    case UPDATE_NODE_PROPERTIES:
      return Object.assign({}, state, {
        activePipelineData: updateNodeProperties({
          pipelineData: state.activePipelineData,
          ...action
        })
      });
    default:
      return state;
  }
}

export default reducer;
