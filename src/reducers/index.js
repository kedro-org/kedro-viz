import { Map } from 'immutable';
import {
  CHANGE_ACTIVE_SNAPSHOT,
  CHANGE_VIEW,
  DELETE_SNAPSHOT,
  RESET_SNAPSHOT_DATA,
  TOGGLE_NODE_ACTIVE,
  TOGGLE_NODE_DISABLED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_PARAMETERS,
  TOGGLE_TAG_ACTIVE,
  TOGGLE_TAG_FILTER,
  // TOGGLE_TAGS_DISABLED,
  TOGGLE_TEXT_LABELS,
} from '../actions';

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
      const pipelineData = Map({
        snapshots: state.pipelineData.get('snapshots').delete(action.id),
        allIDs: state.pipelineData.get('allIDs').filter(d => d !== action.id),
      });
      // If the deleted pipeline is the active one, then use a new active one
      let { activePipeline } = state;
      if (activePipeline === action.id) {
        activePipeline = pipelineData.getIn(['allIDs', 0]);
      }
      return Object.assign({}, state, { activePipeline, pipelineData });
    }

    case RESET_SNAPSHOT_DATA: 
      return Object.assign({}, state, {
        activePipeline: action.snapshots.getIn(['allIDs', 0]),
        pipelineData: action.snapshots,
      });

    case TOGGLE_NODE_ACTIVE: {
      const pipelineData = state.pipelineData.setIn(
        ['snapshots', state.activePipeline, 'nodes', 'active', action.nodeID],
        action.isActive
      );
      return Object.assign({}, state, { pipelineData });
    }

    case TOGGLE_NODE_DISABLED: {
      const pipelineData = state.pipelineData.setIn(
        ['snapshots', state.activePipeline, 'nodes', 'disabled', action.nodeID],
        action.isDisabled
      );
      return Object.assign({}, state, { pipelineData });
    }

    case TOGGLE_NODES_DISABLED: {
      const toggleDisabledNodes = disabled =>
        action.nodeIDs.reduce((newDisabled, id) =>
          newDisabled.set(id, action.isDisabled), disabled);
      const pipelineData = state.pipelineData.updateIn(
        ['snapshots', state.activePipeline, 'nodes', 'disabled'],
        toggleDisabledNodes
      );
      return Object.assign({}, state, { pipelineData });
    }

    case TOGGLE_TEXT_LABELS:
      return Object.assign({}, state, {
        textLabels: action.textLabels,
      });

    case TOGGLE_TAG_ACTIVE: {
      const pipelineData = state.pipelineData.setIn(
        ['snapshots', state.activePipeline, 'tags', 'active', action.tagID],
        action.active
      );
      return Object.assign({}, state, { pipelineData });
    }

    case TOGGLE_TAG_FILTER: {
      let pipelineData = state.pipelineData.setIn(
        ['snapshots', state.activePipeline, 'tags', 'enabled', action.tagID],
        action.enabled
      );
      return Object.assign({}, state, { pipelineData });
    }

    case TOGGLE_PARAMETERS: {
      const paramIDs = state.pipelineData
        .getIn(['snapshots', state.activePipeline, 'nodes', 'allIDs'])
        .filter(id => id.includes('param'));
      const toggleDisabledNodes = disabled =>
        paramIDs.reduce((newDisabled, id) =>
          newDisabled.set(id, !action.parameters), disabled);
      const pipelineData = state.pipelineData.updateIn(
        ['snapshots', state.activePipeline, 'nodes', 'disabled'],
        toggleDisabledNodes
      );
      return Object.assign({}, state, {
        pipelineData,
        parameters: action.parameters,
      });
    }

    default:
      return state;
  }
}

export default reducer;
