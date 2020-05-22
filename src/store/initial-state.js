import { loadState } from './helpers';
import normalizeData from './normalize-data';
import loremIpsum from '../utils/data/lorem-ipsum.mock';
import animals from '../utils/data/animals.mock';
import demo from '../utils/data/demo.mock';
import layers from '../utils/data/layers.mock';
import { getFlagsFromUrl, Flags } from '../utils/flags';

/**
 * Determine where data should be loaded from (i.e. async from JSON,
 * or randomly-generated, or directly via props), then retrieve & format it.
 * @param {string|Array} data Either raw data itself, or a string
 * @return {Object} Normalized data
 */
export const getPipelineData = data => {
  switch (data) {
    case 'lorem':
      // Use data from the 'lorem-ipsum' test dataset
      return loremIpsum;
    case 'animals':
      // Use data from the 'animals' test dataset
      return animals;
    case 'demo':
      // Use data from the 'demo' test dataset
      return demo;
    case 'layers':
      // Use data from the 'layers' test dataset
      return layers;
    case 'json':
      // Return empty state, as data will be loaded asynchronously later
      return null;
    case 'random':
      throw new Error(
        "The random data should already have replaced the 'random' string in 'data-source.js', so if you see this error then something has gone horribly wrong."
      );
    case null:
    case undefined:
      throw new Error('No data was provided to App component via props');
    default:
      // Use data provided via component prop
      return data;
  }
};

/**
 * Generate a new default pipeline state instance
 * @return {Object} Initial state
 */
export const getInitialPipelineState = () => ({
  id: null,
  node: {
    ids: [],
    name: {},
    fullName: {},
    type: {},
    isParam: {},
    tags: {},
    layer: {},
    disabled: {},
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
  const pipelineData = normalizeData(getPipelineData(props.data));

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
      themeBtn: true
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
    fontLoaded: false,
    textLabels,
    visible,
    theme,
    flags
  };
};

export default getInitialState;
