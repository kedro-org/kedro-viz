import deepmerge from 'deepmerge';
import { loadState } from './helpers';
import normalizeData from './normalize-data';
import { getFlagsFromUrl, Flags } from '../utils/flags';

/**
 * Create new default state instance for properties that aren't overridden
 * when the pipeline is reset with new data via the App component's data prop
 * @return {object} state
 */
export const createInitialState = () => ({
  chartSize: {},
  flags: Flags.defaults(),
  textLabels: true,
  theme: 'dark',
  visible: {
    labelBtn: true,
    layerBtn: true,
    exportBtn: true,
    exportModal: false,
    sidebar: true,
    themeBtn: true,
    miniMapBtn: true,
    miniMap: true
  },
  zoom: {}
});

/**
 * Load values from localStorage and combine with existing state,
 * but filter out any unused values from localStorage
 * @param {object} state Initial/extant state
 * @return {object} Combined state from localStorage
 */
export const mergeLocalStorage = state => {
  const localStorageState = loadState();
  Object.keys(localStorageState).forEach(key => {
    if (!state[key]) {
      delete localStorageState[key];
    }
  });
  return deepmerge(state, localStorageState);
};

/**
 * Prepare the pipeline data part of the state. This part is separated so that it
 * can be reset without overriding user settings.
 * @param {object} props Props passed to App component
 */
export const preparePipelineState = props => {
  // Normalize raw data, and apply saved state from localStorage
  const state = mergeLocalStorage(normalizeData(props.data));
  // Use first pipeline in list if active pipeline from localStorage isn't recognised
  if (!state.pipeline.ids.includes(state.pipeline.active)) {
    state.pipeline.active = state.pipeline.ids[0] || null;
  }
  return state;
};

/**
 * Prepare the non-pipeline data part of the state. This part is separated so that it
 * will persist if the pipeline data is reset.
 * Merge local storage and add custom state overrides from props etc
 * @param {object} props Props passed to App component
 */
export const prepareNonPipelineState = props => {
  const state = mergeLocalStorage(createInitialState());
  // Override flag defaults with URL values (on page load only)
  state.flags = Object.assign({}, state.flags, getFlagsFromUrl());
  // Override theme if set in props
  if (props.theme) {
    state.theme = props.theme;
  }
  // Override button visibility if set in props
  if (props.visible) {
    state.visible = Object.assign({}, state.visible, props.visible);
  }
  return state;
};

/**
 * Configure the redux store's initial state, by merging default values
 * with normalised pipeline data and localStorage
 * @param {Object} props App component props
 * @return {Object} Initial state
 */
const getInitialState = (props = {}) => {
  // Perform 2 deepmerges seperately because it performs much faster
  return deepmerge(prepareNonPipelineState(props), preparePipelineState(props));
};

export default getInitialState;
