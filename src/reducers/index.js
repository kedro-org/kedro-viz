import { combineReducers } from 'redux';
import node from './nodes';
import tag from './tags';
import nodeType from './node-type';
import visible from './visible';
import pipeline from './pipeline';
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
 * @param {*} initialState Default state
 * @param {string} type Action type
 * @param {string} key Action payload key
 * @return {*} Updated state
 */
const createReducer = (initialState, type, key) => (
  state = initialState,
  action
) => {
  if (typeof key !== 'undefined' && action.type === type) {
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
  // These props have their own reducers in other files
  flags,
  node,
  nodeType,
  pipeline,
  tag,
  visible,
  // These props don't have any actions associated with them
  edge: createReducer({}),
  id: createReducer(null),
  layer: createReducer({}),
  // These props have very simple non-nested actions
  chartSize: createReducer({}, UPDATE_CHART_SIZE, 'chartSize'),
  fontLoaded: createReducer(false, UPDATE_FONT_LOADED, 'fontLoaded'),
  textLabels: createReducer(true, TOGGLE_TEXT_LABELS, 'textLabels'),
  theme: createReducer('dark', TOGGLE_THEME, 'theme')
});

const rootReducer = (state, action) =>
  resetDataReducer(combinedReducer(state, action), action);

export default rootReducer;
