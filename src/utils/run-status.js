/**
 * Utility functions for handling pipeline run status data
 */

// /**
//  * Format a duration in seconds to a human-readable string
//  * @param {number} seconds - Duration in seconds
//  * @returns {string} - Formatted duration (e.g., "2.5s" or "1m 30s")
//  */
// export const formatDuration = (seconds) => {
//   if (seconds < 60) {
//     return `${seconds.toFixed(2)}s`;
//   }

//   const minutes = Math.floor(seconds / 60);
//   const remainingSeconds = Math.round(seconds % 60);
//   return `${minutes}m ${remainingSeconds}s`;
// };

// /**
//  * Parse pipeline events from kedro_pipeline_events.json
//  * @param {Array} events - Array of pipeline events
//  * @returns {Object} - Object with node statuses keyed by node_id
//  */
// export const parseNodeEvents = (events) => {
//   const nodeStatuses = {};

//   // Process all events to build node status data
//   events.forEach(event => {
//     if (!event.node_id) {
//       return;
//     }

//     switch (event.event) {
//       case 'before_node_run':
//         nodeStatuses[event.node_id] = {
//           name: event.node,
//           status: 'running',
//           startTime: new Date().getTime()
//         };
//         break;

//       case 'after_node_run':
//         if (nodeStatuses[event.node_id]) {
//           nodeStatuses[event.node_id].status = event.status || 'success';
//           nodeStatuses[event.node_id].duration = event.duration_sec;
//         } else {
//           nodeStatuses[event.node_id] = {
//             name: event.node,
//             status: event.status || 'success',
//             duration: event.duration_sec
//           };
//         }
//         break;

//       default:
//         // Ignore other event types
//         break;
//     }
//   });

//   return nodeStatuses;
// };

// /**
//  * Load pipeline events from local JSON file
//  * @returns {Promise} - Promise resolving to parsed node statuses
//  */
// export const loadPipelineEvents = async () => {
//   try {
//     // In a real implementation, you would fetch this from the server
//     // This is a placeholder that would be replaced by actual API call
//     const response = await fetch('/api/pipeline-events');
//     const events = await response.json();
//     return parseNodeEvents(events);
//   } catch (error) {
//     console.error('Error loading pipeline events:', error);
//     return {};
//   }
// };

// /**
//  * Utility functions for processing pipeline run statuses
//  */

// /**
//  * Parse pipeline events to determine the final status of each node
//  * @param {Array} events Array of pipeline events from kedro_pipeline_events.json
//  * @returns {Object} Map of node IDs to their final status ('success', 'failed', or 'running')
//  */
// export function parseNodeStatuses(events) {
//   const nodeStatuses = {};

//   // Process each event in order to determine final status of each node
//   events.forEach(event => {
//     const nodeId = event.node_id;

//     if (!nodeId) {return;}

//     switch (event.event) {
//       case 'before_node_run':
//       case 'before_dataset_loaded':
//       case 'before_dataset_saved':
//         // Node is in progress
//         nodeStatuses[nodeId] = 'running';
//         break;

//       case 'after_node_run':
//         // Node completed successfully or failed
//         if (event.status === 'success' || event.success === true) {
//           nodeStatuses[nodeId] = 'success';
//         } else {
//           nodeStatuses[nodeId] = 'failed';
//         }
//         break;

//       case 'after_dataset_loaded':
//       case 'after_dataset_saved':
//         // Dataset was successfully loaded/saved
//         nodeStatuses[nodeId] = 'success';
//         break;

//       case 'on_node_error':
//       case 'on_dataset_error':
//         // Node failed
//         nodeStatuses[nodeId] = 'failed';
//         break;

//       default:
//         // Keep existing status
//         break;
//     }
//   });

//   return nodeStatuses;
// }

// /**
//  * Check if a modular pipeline has running nodes
//  * @param {Object} modularPipelineChildren Mapping of modular pipeline IDs to their child node IDs
//  * @param {Object} nodeStatuses Map of node IDs to their status
//  * @param {string} modularPipelineId ID of the modular pipeline to check
//  * @returns {boolean} True if the modular pipeline has any running nodes
//  */
// export function hasRunningNodes(modularPipelineChildren, nodeStatuses, modularPipelineId) {
//   const childrenIds = modularPipelineChildren[modularPipelineId] || [];
//   return childrenIds.some(id => {
//     // If the child is itself a modular pipeline, check its children recursively
//     if (modularPipelineChildren[id]) {
//       return hasRunningNodes(modularPipelineChildren, nodeStatuses, id);
//     }
//     // Otherwise check if the node is running
//     return nodeStatuses[id] === 'running';
//   });
// }

// /**
//  * Check if a modular pipeline has failed nodes
//  * @param {Object} modularPipelineChildren Mapping of modular pipeline IDs to their child node IDs
//  * @param {Object} nodeStatuses Map of node IDs to their status
//  * @param {string} modularPipelineId ID of the modular pipeline to check
//  * @returns {boolean} True if the modular pipeline has any failed nodes
//  */
// export function hasFailedNodes(modularPipelineChildren, nodeStatuses, modularPipelineId) {
//   const childrenIds = modularPipelineChildren[modularPipelineId] || [];
//   return childrenIds.some(id => {
//     // If the child is itself a modular pipeline, check its children recursively
//     if (modularPipelineChildren[id]) {
//       return hasFailedNodes(modularPipelineChildren, nodeStatuses, id);
//     }
//     // Otherwise check if the node failed
//     return nodeStatuses[id] === 'failed';
//   });
// }

// /**
//  * Check if a modular pipeline has all successful nodes
//  * @param {Object} modularPipelineChildren Mapping of modular pipeline IDs to their child node IDs
//  * @param {Object} nodeStatuses Map of node IDs to their status
//  * @param {string} modularPipelineId ID of the modular pipeline to check
//  * @returns {boolean} True if all nodes in the modular pipeline are successful
//  */
// export function allNodesSuccessful(modularPipelineChildren, nodeStatuses, modularPipelineId) {
//   const childrenIds = modularPipelineChildren[modularPipelineId] || [];
//   if (childrenIds.length === 0) {return false;}

//   return childrenIds.every(id => {
//     // If the child is itself a modular pipeline, check its children recursively
//     if (modularPipelineChildren[id]) {
//       return allNodesSuccessful(modularPipelineChildren, nodeStatuses, id);
//     }
//     // Otherwise check if the node succeeded
//     return nodeStatuses[id] === 'success';
//   });
// }

// ----------------------------------------------------------------

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
