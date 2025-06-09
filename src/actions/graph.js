import { graph as worker, preventWorkerQueues } from '../utils/worker';
import { toggleGraph } from './index';

export const TOGGLE_GRAPH_LOADING = 'TOGGLE_GRAPH_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {Boolean} loading
 */
export function toggleLoading(loading) {
  return {
    type: TOGGLE_GRAPH_LOADING,
    loading,
  };
}

export const UPDATE_GRAPH_LAYOUT = 'UPDATE_GRAPH_LAYOUT';

/**
 * Update the graph layout object
 * @param {Object} graph
 */
export function updateGraph(graph) {
  return {
    type: UPDATE_GRAPH_LAYOUT,
    graph,
  };
}

// Ensure layoutWorker is assigned
const layoutWorker = preventWorkerQueues(worker, async (instance, state) => {
  return new Promise((resolve) => {
    instance.onmessage = (event) => {
      console.log("🎯 Received result from worker:", event.data);
      resolve(event.data);
    };
    console.log("📩 Sending state to worker:", state);
    instance.postMessage({ action: "graphNew", data: state });
  });
});


/**
 * Async action to calculate graph layout in a web worker
 * whiled displaying a loading spinner
 * @param {Object} graphState A subset of main state
 * @return {Function} A promise that resolves when the calculation is done
 */
export function calculateGraph(graphState) {
  if (!graphState) {
    return updateGraph(graphState);
  }
  return async function (dispatch) {
    dispatch(toggleLoading(true));
    const graph = await layoutWorker(graphState);
    dispatch(toggleGraph(true));
    dispatch(toggleLoading(false));
    return dispatch(updateGraph(graph));
  };
}