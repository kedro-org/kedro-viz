import deepmerge from 'deepmerge';
import { loadState, saveState } from './helpers';
import normalizeData from './normalize-data';
import { getFlagsFromUrl, Flags } from '../utils/flags';
import { sidebarWidth } from '../config';

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
  ignoreLargeWarning: false,
  loading: {
    graph: false,
    pipeline: false,
    node: false,
  },
  visible: {
    graph: true,
    labelBtn: true,
    layerBtn: true,
    exportBtn: true,
    settingsBtn: true,
    exportModal: false,
    plotModal: false,
    settingsModal: false,
    sidebar: window.innerWidth > sidebarWidth.breakpoint,
    code: false,
    themeBtn: true,
    miniMapBtn: true,
    miniMap: true,
  },
  zoom: {},
});

/**
 * Load values from localStorage and combine with existing state,
 * but filter out any unused values from localStorage
 * @param {object} state Initial/extant state
 * @return {object} Combined state from localStorage
 */
export const mergeLocalStorage = (state) => {
  const localStorageState = loadState();
  Object.keys(localStorageState).forEach((key) => {
    if (!state[key]) {
      delete localStorageState[key];
    }
  });
  return deepmerge(state, localStorageState);
};

/**
 * Prepare the pipeline data part of the state by normalizing the raw data,
 * and applying saved state from localStorage.
 * This part is separated so that it can be reset without overriding user settings,
 * because it can be run both on initial state load and again later on.
 * The applyFixes part should only ever be run once, on first load.
 * Exactly when it runs depends on whether the data is loaded asynchronously or not.
 * @param {object} data Data prop passed to App component
 * @param {boolean} applyFixes Whether to override initialState
 */
export const preparePipelineState = (data, applyFixes) => {
  const state = mergeLocalStorage(normalizeData(data));
  if (applyFixes) {
    // Use main pipeline if active pipeline from localStorage isn't recognised
    if (!state.pipeline.ids.includes(state.pipeline.active)) {
      state.pipeline.active = state.pipeline.main;
    }
  }
  return state;
};

/**
 * Prepare the non-pipeline data part of the state. This part is separated so that it
 * will persist if the pipeline data is reset.
 * Merge local storage and add custom state overrides from props etc
 * @param {object} props Props passed to App component
 * @return {object} Updated initial state
 */
export const prepareNonPipelineState = (props) => {
  const state = mergeLocalStorage(createInitialState());

  return {
    ...state,
    flags: { ...state.flags, ...getFlagsFromUrl() },
    theme: props.theme || state.theme,
    visible: { ...state.visible, ...props.visible },
  };
};

/**
 * Configure the redux store's initial state, by merging default values
 * with normalised pipeline data and localStorage.
 * If parameters flag is set to true, then disable parameters on initial load
 * @param {object} props App component props
 * @return {object} Initial state
 */
const getInitialState = (props = {}) => {
  const nonPipelineState = prepareNonPipelineState(props);
  saveState({
    nodeType: {
      // Default to disabled parameters and other types enabled
      disabled: { parameters: true, task: false, data: false },
    },
  });
  const pipelineState = preparePipelineState(props.data, props.data !== 'json');
  return {
    ...nonPipelineState,
    ...pipelineState,
  };
};

export default getInitialState;
