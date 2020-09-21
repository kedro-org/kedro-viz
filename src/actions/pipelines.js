import { dataPath } from '../config';
import loadJsonData from '../store/load-data';
import { preparePipelineState } from '../store/initial-state';

export const UPDATE_ACTIVE_PIPELINE = 'UPDATE_ACTIVE_PIPELINE';

/**
 * Update the actively-selected pipeline
 * @param {string} pipeline Pipeline ID
 */
export function updateActivePipeline(pipeline, data) {
  return {
    type: UPDATE_ACTIVE_PIPELINE,
    pipeline,
    data
  };
}

export const TOGGLE_PIPELINE_LOADING = 'TOGGLE_PIPELINE_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {boolean} loading
 */
export function toggleLoading(loading) {
  return {
    type: TOGGLE_PIPELINE_LOADING,
    loading
  };
}

const getUrl = (pipelineID, pipeline) => {
  if (pipelineID === pipeline.default) {
    return dataPath;
  }
  return `./api/pipelines/${pipelineID}`;
};

/**
 * Async action to calculate graph layout in a web worker
 * whiled displaying a loading spinner
 * @param {Object} graphState A subset of main state
 * @return {function} A promise that resolves when the calcuation is done
 */
export function loadPipelineData(pipelineID) {
  return async function(dispatch, getState) {
    const { pipeline } = getState();
    if (pipelineID === pipeline.active) {
      return;
    }
    dispatch(toggleLoading(true));
    const url = getUrl(pipelineID, pipeline);
    const data = await loadJsonData(url);
    const newState = preparePipelineState({ data });
    newState.pipeline.active = pipelineID;
    dispatch(updateActivePipeline(pipelineID, newState));
    return dispatch(toggleLoading(false));
  };
}
