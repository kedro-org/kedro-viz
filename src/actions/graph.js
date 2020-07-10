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

/**
 * Async action to calculate graph layout in a web worker
 * whiled displaying a loading spinner
 * @param {Object} state Graph calculation arguments
 */
export function calculateGraph(state) {
  return function(dispatch) {
    dispatch(toggleLoading(true));
    const layout = state.flags.newgraph
      ? worker().graphNew
      : worker().graphDagre;

    return layout(state).then(graph => {
      dispatch(toggleLoading(false));
      return dispatch(updateGraph(graph));
    });
  };
}
