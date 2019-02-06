import {
  CHANGE_ACTIVE_SNAPSHOT,
  CHANGE_VIEW,
  DELETE_SNAPSHOT,
  RESET_SNAPSHOT_DATA,
  TOGGLE_PARAMETERS,
  TOGGLE_TAG,
  TOGGLE_TEXT_LABELS,
  UPDATE_NODE_PROPERTIES,
} from '../actions';
import updateNodeProperties from './updateNodeProperties';

function reducer(state = {}, action) {
  switch (action.type) {

    case CHANGE_ACTIVE_SNAPSHOT:
      return Object.assign({}, state, {
        activePipeline: action.snapshotID
      });

    case CHANGE_VIEW:
      return Object.assign({}, state, {
        view: action.view,
      });

    case DELETE_SNAPSHOT: {
      // If snapshot deletion logic is handled upstream via an event handler prop,
      // then use that instead:
      if (state.onDeleteSnapshot) {
        state.onDeleteSnapshot(action.id);
        return state;
      }
      // Else, handle it manually:
      // Remove deleted snapshot data from the list of snapshots,
      const pipelineData = Object.assign({}, state.pipelineData);
      delete pipelineData.snapshots[action.id];
      // and delete the snapshot ID from the list of IDs:
      pipelineData.allIds = pipelineData.allIds.filter(d => d !== action.id);
      // If the deleted pipeline is the active one, then use a new active one
      let { activePipeline } = state;
      if (activePipeline === action.id) {
        activePipeline = pipelineData.allIds[0];
      }
      return Object.assign({}, state, { activePipeline, pipelineData });
    }

    case RESET_SNAPSHOT_DATA: 
      return Object.assign({}, state, {
        activePipeline: action.snapshots.allIds[0],
        pipelineData: action.snapshots,
      });

    case TOGGLE_TEXT_LABELS:
      return Object.assign({}, state, {
        textLabels: action.textLabels,
      });

    case TOGGLE_TAG: {
      const pipelineData = Object.assign({}, state.pipelineData);
      const tags = pipelineData.snapshots[state.activePipeline].tags;
      tags[action.tagID] = !action.disabled;
      return Object.assign({}, state, { pipelineData });
    }

    case TOGGLE_PARAMETERS: {
      const pipelineData = Object.assign({}, state.pipelineData);
      pipelineData.snapshots[state.activePipeline] = updateNodeProperties({
        snapshot: pipelineData.snapshots[state.activePipeline],
        matchNode: node => node.name.includes('param'),
        property: 'disabled',
        value: !action.parameters
      });
      return Object.assign({}, state, {
        pipelineData,
        parameters: action.parameters,
      });
    }

    case UPDATE_NODE_PROPERTIES: {
      const pipelineData = Object.assign({}, state.pipelineData);
      pipelineData.snapshots[state.activePipeline] = updateNodeProperties({
        snapshot: pipelineData.snapshots[state.activePipeline],
        ...action
      });
      return Object.assign({}, state, { pipelineData });
    }
    default:
      return state;
  }
}

export default reducer;
