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
  loading: {
    graph: false,
    pipeline: false
  },
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
 * Prepare the pipeline data part of the state by normalizing the raw data,
 * and applying saved state from localStorage. This part is separated so that it
 * can be reset without overriding user settings.
 * @param {object} data Data prop passed to App component
 */
export const preparePipelineState = data =>
  mergeLocalStorage(normalizeData(data));

/**
 * Prepare the non-pipeline data part of the state. This part is separated so that it
 * will persist if the pipeline data is reset.
 * Merge local storage and add custom state overrides from props etc
 */
export const prepareNonPipelineState = () =>
  mergeLocalStorage(createInitialState());

/**
 * Manually override default/localStorage values if their values are set via
 * component props, URL values etc
 * @param {object} state Computed initial state
 * @param {object} props Props passed to App component
 * @return {object} Updated initial state
 */
export const overideInitialState = (state, props) => {
  // Override with URL values
  const flags = Object.assign({}, state.flags, getFlagsFromUrl());

  // Override if set in props
  const theme = props.theme || state.theme;
  const visible = Object.assign({}, state.visible, props.visible);

  // Use default pipeline if active pipeline from localStorage isn't recognised
  const pipeline = Object.assign({}, state.pipeline);
  if (!state.asyncDataSource && !pipeline.ids.includes(pipeline.active)) {
    pipeline.active = state.pipeline.default;
  }
  return Object.assign({}, state, { flags, theme, visible, pipeline });
};
/**
 * Configure the redux store's initial state, by merging default values
 * with normalised pipeline data and localStorage
 * @param {object} props App component props
 * @return {object} Initial state
 */
const getInitialState = (props = {}) => {
  const initialState = Object.assign(
    {},
    prepareNonPipelineState(),
    preparePipelineState(props.data)
  );
  return overideInitialState(initialState, props);
};
export default getInitialState;
