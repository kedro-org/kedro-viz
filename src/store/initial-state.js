import deepmerge from 'deepmerge';
import { loadState } from './helpers';
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
  edge: {
    ids: [],
    sources: {},
    targets: {},
  },
  flags: Flags.defaults(),
  hoveredParameters: false,
  ignoreLargeWarning: false,
  layer: {
    ids: [],
    name: {},
    visible: true,
  },
  loading: {
    graph: false,
    pipeline: false,
    node: false,
  },
  modularPipeline: {
    ids: [],
    name: {},
    enabled: {},
    active: {},
  },
  node: {
    ids: [],
    name: {},
    fullName: {},
    type: {},
    tags: {},
    layer: {},
    disabled: {},
    pipelines: {},
    clicked: null,
    hovered: null,
    fetched: {},
    code: {},
    parameters: {},
    filepath: {},
    datasetType: {},
    modularPipelines: {},
  },
  nodeType: {
    ids: ['task', 'data', 'parameters'],
    name: {
      data: 'Datasets',
      task: 'Nodes',
      parameters: 'Parameters',
    },
    disabled: {},
  },
  pipeline: {
    ids: [],
    name: {},
  },
  tag: {
    ids: [],
    name: {},
    active: {},
    enabled: {},
  },
  textLabels: true,
  theme: 'dark',
  visible: {
    graph: true,
    labelBtn: true,
    layerBtn: true,
    exportBtn: true,
    exportModal: false,
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
 * Configure the redux store's initial state, by merging default values
 * with normalised pipeline data and localStorage.
 * If parameters flag is set to true, then disable parameters on initial load
 * @param {object} props App component props
 * @return {object} Initial state
 */
const getInitialState = (props = {}) => {
  const state = normalizeData(
    mergeLocalStorage(createInitialState()),
    props.data
  );
  state.flags = { ...state.flags, ...getFlagsFromUrl() };
  state.theme = props.theme || state.theme;
  state.visible = { ...state.visible, ...props.visible };
  if (state.flags.newparams) {
    state.nodeType.disabled.parameters = true;
  }
  return state;
};

export default getInitialState;
