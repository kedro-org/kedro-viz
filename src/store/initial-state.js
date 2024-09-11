import deepmerge from 'deepmerge';
import { loadLocalStorage } from './helpers';
import normalizeData from './normalize-data';
import { getFlagsFromUrl, Flags } from '../utils/flags';
import { mapNodeType, isValidBoolean } from '../utils';
import {
  settings,
  sidebarWidth,
  localStorageName,
  localStorageRunsMetadata,
  params,
  BANNER_KEYS,
} from '../config';

/**
 * Create new default state instance for properties that aren't overridden
 * when the pipeline is reset with new data via the App component's data prop
 * @return {Object} state
 */
export const createInitialState = () => ({
  chartSize: {},
  flags: Flags.defaults(),
  textLabels: true,
  theme: 'dark',
  expandAllPipelines: false,
  isPrettyName: settings.isPrettyName.default,
  showFeatureHints: settings.showFeatureHints.default,
  showDatasetPreviews: settings.showDatasetPreviews.default,
  ignoreLargeWarning: false,
  showBanner: {
    [BANNER_KEYS.LITE]: false,
  },
  loading: {
    graph: false,
    pipeline: false,
    node: false,
  },
  visible: {
    code: false,
    exportModal: false,
    graph: true,
    metadataModal: false,
    miniMap: true,
    modularPipelineFocusMode: null,
    settingsModal: false,
    shareableUrlModal: false,
    sidebar: window.innerWidth > sidebarWidth.breakpoint,
    slicing: true,
  },
  display: {
    globalNavigation: true,
    sidebar: true,
    miniMap: true,
    expandPipelinesBtn: true,
    exportBtn: true,
    labelBtn: true,
    layerBtn: true,
    zoomToolbar: true,
    metadataPanel: true,
  },
  zoom: {},
  runsMetadata: {},
});

export const parseUrlParameters = () => {
  const search = new URLSearchParams(window.location.search);
  return {
    pipelineIdFromURL: search.get(params.pipeline),
    nodeIdFromUrl: search.get(params.selected),
    nodeNameFromUrl: search.get(params.selectedName),
    nodeTypeInUrl: search.get(params.types)
      ? search.get(params.types).split(',')
      : [],
    nodeTagInUrl: search.get(params.tags)
      ? search.get(params.tags).split(',')
      : [],
    expandAllPipelinesInUrl: search.get(params.expandAll),
  };
};

/**
 * Applies URL parameters to the application pipeline state.
 * This function modifies the state based on the URL parameters such as
 * pipeline ID, node ID, node name, node type presence, and tag presence.
 *
 * @param {Object} state The current application pipeline state.
 * @param {Object} urlParams An object containing parsed URL parameters.
 * @returns {Object} The new state with modifications applied based on the URL parameters.
 */
const applyUrlParametersToPipelineState = (state, urlParams) => {
  const {
    pipelineIdFromURL,
    nodeIdFromUrl,
    nodeNameFromUrl,
    nodeTypeInUrl,
    nodeTagInUrl,
  } = urlParams;

  let newState = { ...state };
  const nodeTypes = ['parameters', 'task', 'data'];

  // Use main pipeline if pipeline from URL isn't recognised
  if (pipelineIdFromURL) {
    newState.pipeline.active = newState.pipeline.ids.includes(pipelineIdFromURL)
      ? pipelineIdFromURL
      : newState.pipeline.main;
  }

  // Ensure data tags are on to allow redirection back to the selected node
  if (nodeNameFromUrl) {
    newState.nodeType.disabled.data = false;
  }

  if (nodeTypeInUrl.length) {
    Object.keys(newState.nodeType.disabled).forEach((key) => {
      newState.nodeType.disabled[key] = true;
    });
    nodeTypeInUrl.forEach((key) => {
      newState.nodeType.disabled[mapNodeType(key)] = false;
    });
  }

  // Enable node types based on presence in URL and current node type settings
  if (nodeIdFromUrl && nodeTypes.includes(state.node.type[nodeIdFromUrl])) {
    newState.nodeType.disabled[newState.node.type[nodeIdFromUrl]] = false;
  }

  if (nodeTagInUrl.length) {
    // Set all tags to false initially
    Object.keys(newState.tag.enabled).forEach((key) => {
      newState.tag.enabled[key] = false;
    });
    nodeTagInUrl.forEach((tag) => {
      newState.tag.enabled[tag] = true;
    });
  }

  return newState;
};

/**
 * Applies URL parameters to the application non-pipeline state.
 * This function modifies the state based on the URL parameters such as
 * expandAllPipelines presence.
 *
 * @param {Object} state The current application non-pipeline state.
 * @param {Object} urlParams An object containing parsed URL parameters.
 * @returns {Object} The new state with modifications applied based on the URL parameters.
 */
const applyUrlParametersToNonPipelineState = (state, urlParams) => {
  const { expandAllPipelinesInUrl } = urlParams;
  let newState = { ...state };
  if (expandAllPipelinesInUrl && isValidBoolean(expandAllPipelinesInUrl)) {
    newState.expandAllPipelines = JSON.parse(expandAllPipelinesInUrl);
  }
  return newState;
};

/**
 * Load values from localStorage and combine with existing state,
 * but filter out any unused values from localStorage
 * @param {Object} state Initial/extant state
 * @return {Object} Combined state from localStorage
 */
export const mergeLocalStorage = (state) => {
  const localStorageState = loadLocalStorage(localStorageName);
  const localStorageRunsMetadataState = loadLocalStorage(
    localStorageRunsMetadata
  );
  Object.keys(localStorageState).forEach((key) => {
    if (!(key in state)) {
      delete localStorageState[key];
    }
  });
  const allLocalStorageState = {
    ...localStorageState,
    ...{ runsMetadata: localStorageRunsMetadataState },
  };
  return deepmerge(state, allLocalStorageState);
};

/**
 * Prepare the pipeline data part of the state by normalizing the raw data,
 * and applying saved state from localStorage.
 * This part is separated so that it can be reset without overriding user settings,
 * because it can be run both on initial state load and again later on.
 * The applyFixes part should only ever be run once, on first load.
 * Exactly when it runs depends on whether the data is loaded asynchronously or not.
 * @param {Object} data Data prop passed to App component
 * @param {Boolean} applyFixes Whether to override initialState
 * @param {Boolean} expandAllPipelines Whether to expand all the modular pipelines
 * @param {Object} urlParams An object containing parsed URL parameters.
 * @returns {Object} The new pipeline state with modifications applied.
 */
export const preparePipelineState = (
  data,
  applyFixes,
  expandAllPipelines,
  urlParams
) => {
  let state = mergeLocalStorage(normalizeData(data, expandAllPipelines));

  if (applyFixes) {
    // Use main pipeline if active pipeline from localStorage isn't recognised
    if (!state.pipeline.ids.includes(state.pipeline.active)) {
      state.pipeline.active = state.pipeline.main;
    }
  }
  if (urlParams) {
    state = applyUrlParametersToPipelineState(state, urlParams);
  }

  return state;
};

/**
 * Prepare the non-pipeline data part of the state. This part is separated so that it
 * will persist if the pipeline data is reset.
 * Merge local storage and add custom state overrides from props etc
 * @param {object} props Props passed to App component
 * @param {Object} urlParams An object containing parsed URL parameters.
 * @returns {Object} The new non-pipeline state with modifications applied.
 */
export const prepareNonPipelineState = (urlParams) => {
  let state = mergeLocalStorage(createInitialState());

  if (urlParams) {
    state = applyUrlParametersToNonPipelineState(state, urlParams);
  }

  return {
    ...state,
    flags: { ...state.flags, ...getFlagsFromUrl() },
  };
};

/**
 * Configure the redux store's initial state, by merging default values
 * with normalised pipeline data and localStorage.
 * If parameters flag is set to true, then disable parameters on initial load
 * @param {Object} props App component props
 * @return {Object} Initial state
 */
const getInitialState = (props = {}) => {
  const urlParams = parseUrlParameters();
  const nonPipelineState = prepareNonPipelineState(urlParams);
  let expandAllPipelines = nonPipelineState.expandAllPipelines;

  if (props.options) {
    expandAllPipelines =
      props.options.expandAllPipelines || nonPipelineState.expandAllPipelines;
  }

  const pipelineState = preparePipelineState(
    props.data,
    props.data !== 'json',
    expandAllPipelines
  );

  const initialState = {
    ...nonPipelineState,
    ...pipelineState,
  };

  return props.options ? deepmerge(initialState, props.options) : initialState;
};

export default getInitialState;
