import { combineReducers } from 'redux';
import runsMetadata from './runs-metadata';
import flags from './flags';
import graph from './graph';
import layer from './layers';
import loading from './loading';
import node from './nodes';
import nodeType from './node-type';
import pipeline from './pipeline';
import tag from './tags';
import merge from 'lodash/merge';
import modularPipeline from './modular-pipelines';
import visible from './visible';
import slice from './slice';
import bannerReducer from './banner';
import {
  RESET_DATA,
  TOGGLE_SHOW_FEATURE_HINTS,
  TOGGLE_HOVERED_FOCUS_MODE,
  TOGGLE_IGNORE_LARGE_WARNING,
  TOGGLE_IS_PRETTY_NAME,
  TOGGLE_TEXT_LABELS,
  TOGGLE_THEME,
  UPDATE_CHART_SIZE,
  UPDATE_ZOOM,
  TOGGLE_EXPAND_ALL_PIPELINES,
  UPDATE_STATE_FROM_OPTIONS,
  TOGGLE_SHOW_DATASET_PREVIEWS,
} from '../actions';
import { TOGGLE_PARAMETERS_HOVERED } from '../actions';

/**
 * Create a generic reducer
 * @param {*} initialState Default state
 * @param {String} type Action type
 * @param {String} key Action payload key
 * @return {*} Updated state
 */
const createReducer =
  (initialState, type, key) =>
  (state = initialState, action) => {
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

/**
 * Update state from options props coming form react component
 * @param {Object} state Complete app state
 * @param {Object} action Redux action
 * @return {Object} Updated state
 */
function updateStateFromOptionsReducer(state = {}, action) {
  if (action.type === UPDATE_STATE_FROM_OPTIONS) {
    return merge({}, state, action.payload);
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
  slice,
  tag,
  modularPipeline,
  visible,
  runsMetadata,
  showBanner: bannerReducer,
  // These props don't have any actions associated with them
  display: createReducer(null),
  dataSource: createReducer(null),
  behaviour: createReducer({}),
  edge: createReducer({}),
  // These props have very simple non-nested actions
  chartSize: createReducer({}, UPDATE_CHART_SIZE, 'chartSize'),
  zoom: createReducer({}, UPDATE_ZOOM, 'zoom'),
  textLabels: createReducer(true, TOGGLE_TEXT_LABELS, 'textLabels'),
  theme: createReducer('dark', TOGGLE_THEME, 'theme'),
  isPrettyName: createReducer(false, TOGGLE_IS_PRETTY_NAME, 'isPrettyName'),
  showFeatureHints: createReducer(
    true,
    TOGGLE_SHOW_FEATURE_HINTS,
    'showFeatureHints'
  ),
  hoveredParameters: createReducer(
    false,
    TOGGLE_PARAMETERS_HOVERED,
    'hoveredParameters'
  ),
  ignoreLargeWarning: createReducer(
    false,
    TOGGLE_IGNORE_LARGE_WARNING,
    'ignoreLargeWarning'
  ),
  hoveredFocusMode: createReducer(
    false,
    TOGGLE_HOVERED_FOCUS_MODE,
    'hoveredFocusMode'
  ),
  expandAllPipelines: createReducer(
    false,
    TOGGLE_EXPAND_ALL_PIPELINES,
    'shouldExpandAllPipelines'
  ),
  showDatasetPreviews: createReducer(
    true,
    TOGGLE_SHOW_DATASET_PREVIEWS,
    'showDatasetPreviews'
  ),
});

const rootReducer = (state, action) => {
  let newState = resetDataReducer(state, action);
  newState = updateStateFromOptionsReducer(newState, action);
  return combinedReducer(newState, action);
};

export default rootReducer;
