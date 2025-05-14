/**
 * Fetch pipeline run events from the API endpoint
 * @returns {Promise<Array>} Array of pipeline run events
 */
export const fetchRunEvents = async () => {
  try {
    const response = await fetch('/api/run-events');
    if (!response.ok) {
      throw new Error(`Error fetching run events: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load run events:', error);
    return [];
  }
};

/**
 * Process run events into a format usable by the flowchart
 * @param {Array} response API response containing run events data
 * @returns {Object} Processed run status data
 */
export const processRunEvents = (response) => {
  const nodeStatus = {};
  const datasetStatus = {};

  // Check if the response contains events array
  const events = response.events || [];

  events.forEach((event) => {
    if (event.event === 'after_node_run' && event.node_id) {
      nodeStatus[event.node_id] = {
        status: event.status || 'success',
        duration: event.duration_sec,
      };
    } else if (event.event === 'on_node_error' && event.node_id) {
      nodeStatus[event.node_id] = {
        status: 'error',
        error: event.error,
      };
    } else if (
      (event.event === 'after_dataset_loaded' ||
        event.event === 'after_dataset_saved') &&
      event.node_id
    ) {
      datasetStatus[event.node_id] = {
        type: event.event === 'after_dataset_loaded' ? 'loaded' : 'saved',
        time:
          event.event === 'after_dataset_loaded'
            ? event.load_time_sec
            : event.save_time_sec,
        size: event.size_bytes,
      };
    }
  });

  return {
    nodeStatus,
    datasetStatus,
  };
};
