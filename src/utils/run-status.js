/**
 * Fetch pipeline run events from the API endpoint
 * @returns {Promise<Object>} Pipeline run events data in structured format
 */
export const fetchRunEvents = async () => {
  try {
    const response = await fetch(`/api/run-events`);
    if (!response.ok) {
      throw new Error(`Error fetching run events: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load run events:', error);
    return { nodes: {}, datasets: {}, pipeline: {} };
  }
};

/**
 * Process structured run events into a format usable by the flowchart
 * @param {Object} response API response containing structured run events data
 * @returns {Object} Processed run status data
 */
export const processRunEvents = (response) => {
  const groupedData = {
    nodes: {},
    datasets: {},
    pipeline: {},
  };

  // Process nodes from structured format
  Object.entries(response.nodes || {}).forEach(([nodeId, nodeInfo]) => {
    groupedData.nodes[nodeId] = {
      status: nodeInfo.status,
      durationSec: nodeInfo.duration_sec,
      error: nodeInfo.error,
    };
  });

  // Process datasets from structured format
  Object.entries(response.datasets || {}).forEach(
    ([datasetId, datasetInfo]) => {
      groupedData.datasets[datasetId] = {
        name: datasetInfo.name,
        sizeBytes: datasetInfo.size_bytes,
        status: datasetInfo.status,
        error: datasetInfo.error,
      };
    }
  );

  // Process pipeline data
  if (response.pipeline) {
    groupedData.pipeline = {
      runId: response.pipeline.run_id,
      startTime: response.pipeline.start_time,
      endTime: response.pipeline.end_time,
      totalDurationSec: response.pipeline.total_duration_sec,
      status: response.pipeline.status,
      error: response.pipeline.error,
    };
  } else {
    // Set a default run ID if none provided
    groupedData.pipeline = {
      ...groupedData.pipeline,
      runId: `run-${Date.now()}`,
    };
  }

  return {
    groupedData,
  };
};
