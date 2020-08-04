import { loadState } from './helpers';
import normalizeData from './normalize-data';
import { getFlagsFromUrl, Flags } from '../utils/flags';

/**
 * Generate a new default pipeline state instance
 * @return {Object} Initial state
 */
export const getInitialPipelineState = () => ({
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
  }
});

/**
 * Configure the redux store's initial state
 * @param {Object} props App component props
 * @return {Object} Initial state
 */
const getInitialState = (props = {}) => {
  if (!props.data) {
    throw new Error('No data provided');
  }
  const pipelineData = normalizeData(props.data);

  // Load properties from localStorage if defined, else use defaults
  const localStorageState = loadState();
  const { textLabels = true, nodeTypeDisabled } = localStorageState;
  const theme = props.theme || localStorageState.theme || 'dark';

  const visible = Object.assign(
    {
      labelBtn: true,
      layerBtn: true,
      layers: Boolean(pipelineData.layer.ids.length),
      exportBtn: true,
      exportModal: false,
      sidebar: true,
      themeBtn: true,
      miniMapBtn: true,
      miniMap: true
    },
    localStorageState.visible,
    props.visible
  );

  const flags = {
    ...Flags.defaults(),
    ...localStorageState.flags,
    ...getFlagsFromUrl()
  };

  if (nodeTypeDisabled) {
    pipelineData.nodeType.disabled = nodeTypeDisabled;
  }

  return {
    ...pipelineData,
    chartSize: {},
    zoom: {},
    fontLoaded: false,
    textLabels,
    visible,
    theme,
    flags
  };
};

export default getInitialState;
