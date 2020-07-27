import deepmerge from 'deepmerge';
import { loadState } from './helpers';
import normalizeData from './normalize-data';
import { getFlagsFromUrl, Flags } from '../utils/flags';

/**
 * Create new global default pipeline state instance
 * @return {object} state
 */
export const createInitialState = () => ({
  id: null,
  pipeline: {
    ids: [],
    name: {},
    active: null
  },
  node: {
    ids: [],
    name: {},
    fullName: {},
    type: {},
    isParam: {},
    tags: {},
    layer: {},
    disabled: {},
    pipelines: {},
    clicked: null,
    hovered: null
  },
  nodeType: {
    ids: ['task', 'data', 'parameters'],
    name: {
      data: 'Datasets',
      task: 'Nodes',
      parameters: 'Parameters'
    },
    disabled: {}
  },
  edge: {
    ids: [],
    sources: {},
    targets: {}
  },
  layer: {
    ids: [],
    name: {}
  },
  tag: {
    ids: [],
    name: {},
    active: {},
    enabled: {}
  },
  chartSize: {},
  textLabels: true,
  theme: 'dark',
  flags: Flags.defaults(),
  visible: {
    labelBtn: true,
    layerBtn: true,
    layers: true,
    exportBtn: true,
    exportModal: false,
    sidebar: true,
    themeBtn: true
  }
});

/**
 * Add state overrides from props, URL flags, etc
 * @param {object} state App state
 * @param {object} props Props passed to App component
 */
const overrideInitialState = (state, props) => {
  // Override flag defaults with URL values
  state.flags = Object.assign(state.flags, getFlagsFromUrl());
  // Override theme if set in props
  if (props.theme) {
    state.theme = props.theme;
  }
  // Override button visibility if set in props
  if (props.visible) {
    state.visible = Object.assign(state.visible, props.visible);
  }
  // Turn layers off if there are no layers present:
  if (!state.layer.ids.length) {
    state.visible.layers = false;
  }
  return state;
};

/**
 * Configure the redux store's initial state
 * @param {Object} props App component props
 * @return {Object} Initial state
 */
const getInitialState = (props = {}) => {
  // Merge prop data and localStorage data into initial state
  const state = deepmerge(normalizeData(props.data), loadState());
  // Add overrides from props etc
  return overrideInitialState(state, props);
};

export default getInitialState;
