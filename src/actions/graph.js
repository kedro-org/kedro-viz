import worker from '../utils/graph/worker';

export const TOGGLE_LOADING = 'TOGGLE_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {Object} loading
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

export function calculateGraph(input) {
  return function(dispatch) {
    dispatch(toggleLoading(true));
    const layout = input.flags.newgraph
      ? worker().graphNew
      : worker().graphDagre;

    return layout(input).then(graph => {
      dispatch(toggleLoading(false));
      return dispatch(updateGraph(graph));
    });
  };
}
