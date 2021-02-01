import { graph as worker, preventWorkerQueues } from '../utils/worker';
import { toggleGraph } from './index';
import { chonkyNodeAmount } from '../config';

export const TOGGLE_GRAPH_LOADING = 'TOGGLE_GRAPH_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {boolean} loading
 */
export function toggleLoading(loading) {
  return {
    type: TOGGLE_GRAPH_LOADING,
    loading
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
    graph
  };
}

export const TOGGLE_DISPLAY_CHONKY_GRAPH = 'TOGGLE_DISPLAY_CHONKY_GRAPH';

/**
 * resets the disaplyChonkyGraph setting to enable chonky graphs to load
 * @param {boolean} isChonkyGraph
 */
export function toggleDisplayChonkyGraph(displayChonkyGraph) {
  return {
    type: TOGGLE_DISPLAY_CHONKY_GRAPH,
    displayChonkyGraph
  };
}

export const TOGGLE_IS_CHONKY = 'TOGGLE_IS_CHONKY';

/**
 * sets the isChonky field so wrapper is aware that the selected combination is chonky
 * @param {boolean} isChonky
 */
export function toggleIsChonky(isChonky) {
  return {
    type: TOGGLE_IS_CHONKY,
    isChonky
  };
}

export const UPDATE_NODESNO = 'UPDATE_NODESNO';

/**
 * updates the nodes no. for warning reference
 * @param {integer} nodesNo
 */
export function updateNodesNo(nodesNo) {
  return {
    type: UPDATE_NODESNO,
    nodesNo
  };
}

export const UPDATE_EDGESNO = 'UPDATE_EDGESNO';

/**
 * updates the edges no. for reference
 * @param {integer} edgesNo
 */
export function updateEdgesNo(edgesNo) {
  return {
    type: UPDATE_EDGESNO,
    edgesNo
  };
}

/**
 * Choose which layout engine to use based on the oldgraph flag
 * @param {Object} instance Worker parent instance
 * @param {Object} state A subset of main state
 * @return {function} Promise function
 */
const chooseLayout = (instance, state) =>
  state.oldgraph ? instance.graphDagre(state) : instance.graphNew(state);

// Prepare new layout worker
const layoutWorker = preventWorkerQueues(worker, chooseLayout);

/**
 * Formula to determine if the pipeline is chonky
 */
const isChonky = (chonkyNodeAmount, nodesNo, edgesNo) => {
  return nodesNo + 1.5 * edgesNo > chonkyNodeAmount ? true : false;
};

/**
 * Async action to calculate graph layout in a web worker
 * whiled displaying a loading spinner
 * @param {Object} graphState A subset of main state
 * @return {function} A promise that resolves when the calcuation is done
 */
export function calculateGraph(graphState, customChonkyLimit) {
  if (!graphState) {
    return updateGraph(graphState);
  }
  return async function(dispatch) {
    const { nodes, edges, displayChonkyGraph } = graphState;

    const chonkyLimit = customChonkyLimit || chonkyNodeAmount;

    if (
      isChonky(chonkyLimit, nodes.length, edges.length) === true &&
      displayChonkyGraph === false
    ) {
      dispatch(toggleIsChonky(true));
      dispatch(updateNodesNo(nodes.length));
      dispatch(updateEdgesNo(edges.length));
    } else {
      dispatch(toggleIsChonky(false));
      dispatch(toggleLoading(true));
      const graph = await layoutWorker(graphState);
      dispatch(toggleGraph(true));
      dispatch(toggleLoading(false));
      return dispatch(updateGraph(graph));
    }
  };
}
