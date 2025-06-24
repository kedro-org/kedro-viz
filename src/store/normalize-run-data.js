/**
 * Create new default pipeline run status state instance
 * @return {Object} state
 */
export const createInitialRunStatusState = () => ({
  nodes: {},
  datasets: {},
  pipeline: {},
});

/**
 * Check whether data is in expected format
 * @param {Object} data - The parsed data input
 * @return {Boolean} True if valid for formatting
 */
const validateRunStatusInput = (data) => {
  if (!data) {
    return;
  }

  const isValidNodes =
    data.nodes && typeof data.nodes === 'object' && !Array.isArray(data.nodes);
  const isValidDatasets =
    data.datasets &&
    typeof data.datasets === 'object' &&
    !Array.isArray(data.datasets);
  const isValidPipeline =
    data.pipeline &&
    typeof data.pipeline === 'object' &&
    !Array.isArray(data.pipeline);

  if (!isValidNodes || !isValidDatasets || !isValidPipeline) {
    throw new Error(
      'Invalid Kedro-Viz run data input. Please ensure that your pipeline run data includes nodes, datasets, and pipeline'
    );
  }
  return true;
};

/** * Process the raw run status data into a structured format
 * @param {Object} data Raw unformatted data input
 * @return {Object} Processed run status state
 */
export const processRunStatus = (data) => {
  const state = createInitialRunStatusState();

  // Process nodes from structured format
  Object.entries(data.nodes || {}).forEach(([nodeId, nodeInfo]) => {
    state.nodes[nodeId] = {
      status: nodeInfo.status,
      duration: nodeInfo.duration,
      error: nodeInfo.error,
    };
  });

  // Process datasets from structured format
  Object.entries(data.datasets || {}).forEach(([datasetId, datasetInfo]) => {
    state.datasets[datasetId] = {
      name: datasetInfo.name,
      size: datasetInfo.size,
      status: datasetInfo.status,
      error: datasetInfo.error,
    };
  });

  // Process pipeline data
  if (data.pipeline) {
    state.pipeline = {
      runId: data.pipeline.run_id,
      startTime: data.pipeline.start_time,
      endTime: data.pipeline.end_time,
      duration: data.pipeline.duration,
      status: data.pipeline.status,
      error: data.pipeline.error,
    };
  } else {
    // Set a default run ID if none provided
    state.pipeline = {
      ...state.pipeline,
      runId: `run-${Date.now()}`,
    };
  }

  return state;
};

/**
 * Convert the pipeline data into a normalized state object
 * @param {Object} data Raw unformatted data input
 * @return {Object} Formatted, normalized state
 */
const normalizeRunStatusData = (data) => {
  const state = createInitialRunStatusState();

  if (!validateRunStatusInput(data)) {
    return state;
  }

  const updatedState = processRunStatus(data);

  return updatedState;
};

export default normalizeRunStatusData;
