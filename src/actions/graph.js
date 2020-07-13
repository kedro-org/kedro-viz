import worker from '../utils/graph/worker';

export const TOGGLE_LOADING = 'TOGGLE_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {boolean} loading
 */
export function toggleLoading(loading) {
  return {
    type: TOGGLE_LOADING,
    loading
  };
}

/**
 * Manage the layout worker, avoiding race conditions by terminating running
 * processes and reinitialising the instance
 */
function createLayoutWorker() {
  let instance = worker();
  let running = false;

  // Choose which layout engine to use based on the newgraph flag
  const chooseLayout = newgraph =>
    newgraph ? instance.graphNew : instance.graphDagre;

  return state => {
    if (running) {
      // If worker is already processing a job, cancel it and restart
      instance.terminate();
      instance = worker();
    }
    running = true;
    const layout = chooseLayout(state.flags.newgraph);

    return layout(state).then(graph => {
      running = false;
      return graph;
    });
  };
}

export const UPDATE_GRAPH = 'UPDATE_GRAPH';

/**
 * Update the graph layout object
 * @param {Object} graph
 */
export function updateGraph(graph) {
  return {
    type: UPDATE_GRAPH,
    graph
  };
}

const layoutWorker = createLayoutWorker();

/**
 * Async action to calculate graph layout in a web worker
 * whiled displaying a loading spinner
 * @param {Object} state Graph calculation arguments
 * @return {function} A promise that resolves when the calcuation is done
 */
export function calculateGraph(state) {
  return async function(dispatch) {
    dispatch(toggleLoading(true));
    const graph = await layoutWorker(state);
    dispatch(toggleLoading(false));
    return dispatch(updateGraph(graph));
  };
}
