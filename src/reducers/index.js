import { combineReducers } from 'redux';
import node from './nodes';
import tag from './tags';
import nodeType from './node-type';
import visible from './visible';
import flags from './flags';
import {
  RESET_DATA,
  TOGGLE_TEXT_LABELS,
  TOGGLE_THEME,
  UPDATE_CHART_SIZE,
  UPDATE_FONT_LOADED
} from '../actions';

/**
 * Create a generic reducer
 * @param {string} type Action type
 * @param {string} key Action payload key
 * @param {*} initialState Default state
 * @return {*} Updated state
 */
const createReducer = (type, key, initialState) => (
  state = initialState,
  action
) => {
  if (action.type === type) {
    return action[key];
  }
  return state;
};

/**
 * Reset/update application-wide data
 * @param {Object} state Complete app state
 * @param {Object} action Redux action
 * @return {Object} Updated(?) state
 */
function resetDataReducer(state = {}, action) {
  if (action.type === RESET_DATA) {
    return Object.assign({}, state, action.data);
  }
  return state;
}

const combinedReducer = combineReducers({
  node,
  nodeType,
  tag,
  visible,
  flags,
  edge: (state = {}) => state,
  id: (state = null) => state,
  layer: (state = {}) => state,
  chartSize: createReducer(UPDATE_CHART_SIZE, 'chartSize', {}),
  fontLoaded: createReducer(UPDATE_FONT_LOADED, 'fontLoaded', false),
  textLabels: createReducer(TOGGLE_TEXT_LABELS, 'textLabels', true),
  theme: createReducer(TOGGLE_THEME, 'theme', 'dark')
});

const rootReducer = (state, action) =>
  resetDataReducer(combinedReducer(state, action), action);

export default rootReducer;
