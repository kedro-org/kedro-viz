import { getUrl } from '../config';
import loadJsonData from '../store/load-data';
import { preparePipelineState } from '../store/initial-state';
import { resetData } from './index';

/**
 * This file contains actions that update the active pipeline, and if loading data
 * asynchronously, they also handle loading this pipeline data from different endpoints.
 *
 * Many different cases need to be addressed, including:
 * 1. Loading data synchronously, or asynchonously.
 * 2. Loading data and updating the pipeline on first page load, or on user actions.
 * 3. Whether the dataset has pipelines defined in it, or not.
 * 4. Whether localStorage has an active pipeline already defined.
 * 5. If so, whether it exists in the current dataset.
 * 6. Whether the requested endpoint is the 'main' one, or not.
 * 7. Whether the pipeline flag is disabled.
 *
 * These are mostly handled either within this file, in the preparePipelineState
 * utility, or in the getNodeDisabledPipeline selector. Please see their tests
 * for more info about implementation requirements.
 */

export const UPDATE_ACTIVE_PIPELINE = 'UPDATE_ACTIVE_PIPELINE';

/**
 * Update the actively-selected pipeline
 * @param {string} pipeline Pipeline ID
 */
export function updateActivePipeline(pipeline) {
  return {
    type: UPDATE_ACTIVE_PIPELINE,
    pipeline
  };
}

export const TOGGLE_PIPELINE_LOADING = 'TOGGLE_PIPELINE_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {boolean} loading True if pipeline is still loading
 */
export function toggleLoading(loading) {
  return {
    type: TOGGLE_PIPELINE_LOADING,
    loading
  };
}

/**
 * Determine where to load data from
 * @param {object} pipeline Pipeline state
 */
export const getPipelineUrl = pipeline => {
  if (pipeline.active === pipeline.default) {
    return getUrl('main');
  }
  return getUrl('pipeline', pipeline.active);
};

/**
 * Check whether to make another async data request
 * @param {object} pipeline Pipeline state
 */
export const requiresSecondRequest = (flags, pipeline) => {
  // Pipelines are disabled via flags
  // TODO: Delete this line when removing flags.pipeline
  if (!flags.pipelines) return false;
  // Pipelines are not present in the data
  if (!pipeline.ids.length || !pipeline.default) return false;
  // There is no active pipeline set
  if (!pipeline.active) return false;
  return pipeline.active !== pipeline.default;
};

/**
 * Load pipeline data on initial page-load
 * @return {function} A promise that resolves when the data is loaded
 */
export function loadInitialPipelineData() {
  return async function(dispatch, getState) {
    // Get a copy of the full state from the store
    const state = getState();
    // If data is passed synchronously then this process isn't necessary
    if (!state.asyncDataSource) {
      return;
    }
    // Load 'main' data file
    dispatch(toggleLoading(true));
    const url = getUrl('main');
    let newState = await loadJsonData(url).then(data =>
      preparePipelineState(data, true)
    );
    // If the active pipeline isn't main then request data from new URL
    if (requiresSecondRequest(state.flags, newState.pipeline)) {
      const url = getPipelineUrl(newState.pipeline);
      newState = await loadJsonData(url).then(preparePipelineState);
    }
    dispatch(resetData(newState));
    dispatch(toggleLoading(false));
  };
}

/**
 * Change pipeline on selection, loading new data if necessary
 * @param {string} pipelineID Unique ID for new pipeline
 * @return {function} A promise that resolves when the data is loaded
 */
export function loadPipelineData(pipelineID) {
  return async function(dispatch, getState) {
    const { asyncDataSource, pipeline } = getState();
    if (pipelineID && pipelineID === pipeline.active) {
      return;
    }
    if (asyncDataSource) {
      dispatch(toggleLoading(true));
      const url = getPipelineUrl({
        default: pipeline.default,
        active: pipelineID
      });
      const newState = await loadJsonData(url).then(preparePipelineState);
      newState.pipeline.active = pipelineID;
      dispatch(resetData(newState));
      dispatch(toggleLoading(false));
    } else {
      dispatch(updateActivePipeline(pipelineID));
    }
  };
}
