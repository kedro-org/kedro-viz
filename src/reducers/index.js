import { combineReducers } from 'redux';
import flags from './flags';
import graph from './graph';
import layer from './layers';
import loading from './loading';
import node from './nodes';
import nodeType from './node-type';
import pipeline from './pipeline';
import tag from './tags';
import visible from './visible';
import {
  RESET_DATA,
  TOGGLE_TEXT_LABELS,
  TOGGLE_THEME,
  UPDATE_CHART_SIZE,
  UPDATE_ZOOM,
  UPDATE_FONT_LOADED,
  TOGGLE_IGNORE_LARGE_WARNING,
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
  graph,
  layer,
  loading,
  node,
  nodeType,
  pipeline,
  tag,
  visible,
  // These props don't have any actions associated with them
  asyncDataSource: createReducer(false),
  edge: createReducer({}),
  modularPipeline: createReducer({}),
  // These props have very simple non-nested actions
  chartSize: createReducer({}, UPDATE_CHART_SIZE, 'chartSize'),
  zoom: createReducer({}, UPDATE_ZOOM, 'zoom'),
  fontLoaded: createReducer(false, UPDATE_FONT_LOADED, 'fontLoaded'),
  textLabels: createReducer(true, TOGGLE_TEXT_LABELS, 'textLabels'),
  theme: createReducer('dark', TOGGLE_THEME, 'theme'),
  ignoreLargeWarning: createReducer(
    false,
    TOGGLE_IGNORE_LARGE_WARNING,
    'ignoreLargeWarning'
  ),
});

const rootReducer = (state, action) =>
  combinedReducer(resetDataReducer(state, action), action);

export default rootReducer;
