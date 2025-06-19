/**
 * Fetch pipeline run status from the API endpoint
 * @returns {Promise<Object>} Pipeline run status in structured format
 */
export const fetchRunStatus = async () => {
  try {
    const response = await fetch(`/api/run-status`);
    if (!response.ok) {
      throw new Error(`Error fetching run status: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load run status:', error);
    return { nodes: {}, datasets: {}, pipeline: {} };
  }
};

/**
 * Process the run status data from the API response
 * @param {Object} response API response containing run status data
 * @returns {Object} Processed run status data
 */
export const processRunStatus = (response) => {
  const runStatusData = {
    nodes: {},
    datasets: {},
    pipeline: {},
  };

  // Process nodes from structured format
  Object.entries(response.nodes || {}).forEach(([nodeId, nodeInfo]) => {
    runStatusData.nodes[nodeId] = {
      status: nodeInfo.status,
      duration: nodeInfo.duration,
      error: nodeInfo.error,
    };
  });

  // Process datasets from structured format
  Object.entries(response.datasets || {}).forEach(
    ([datasetId, datasetInfo]) => {
      runStatusData.datasets[datasetId] = {
        name: datasetInfo.name,
        size: datasetInfo.size,
        status: datasetInfo.status,
        error: datasetInfo.error,
      };
    }
  );

  // Process pipeline data
  if (response.pipeline) {
    runStatusData.pipeline = {
      runId: response.pipeline.run_id,
      startTime: response.pipeline.start_time,
      endTime: response.pipeline.end_time,
      duration: response.pipeline.duration,
      status: response.pipeline.status,
      error: response.pipeline.error,
    };
  } else {
    // Set a default run ID if none provided
    runStatusData.pipeline = {
      ...runStatusData.pipeline,
      runId: `run-${Date.now()}`,
    };
  }

  return runStatusData;
};

/** * Handle the latest run status by comparing end times
 * @param {Object} processedData Processed run status data
 * @returns {boolean} True if the latest run is newer than the last stored run
 */
export const handleLatestRunStatus = (processedData) => {
  const endTime = processedData.pipeline.endTime;
  const lastEndTime = localStorage.getItem('lastRunEndTime');

  const isLatestRun =
    !lastEndTime ||
    new Date(endTime).getTime() > new Date(lastEndTime).getTime();
  return isLatestRun;
};
