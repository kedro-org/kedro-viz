import { getUrl } from '../utils';
import loadJsonData from '../store/load-data';
import { preparePipelineState } from '../store/initial-state';
import { resetData } from './index';

export const TOGGLE_NODE_CLICKED = 'TOGGLE_NODE_CLICKED';

/**
 * Update the value of the currently-active clicked node
 * @param {string|null} nodeClicked The node's unique identifier
 */
export function toggleNodeClicked(nodeClicked) {
  return {
    type: TOGGLE_NODE_CLICKED,
    nodeClicked
  };
}

export const TOGGLE_NODES_DISABLED = 'TOGGLE_NODES_DISABLED';

/**
 * Toggle a selected group of nodes' visibility on/off
 * @param {Array} nodeIDs The nodes' unique identifiers
 * @param {Boolean} isDisabled Whether the node should be visible
 */
export function toggleNodesDisabled(nodeIDs, isDisabled) {
  return {
    type: TOGGLE_NODES_DISABLED,
    nodeIDs,
    isDisabled
  };
}

export const TOGGLE_NODE_HOVERED = 'TOGGLE_NODE_HOVERED';

/**
 * Update the value of the currently-active hovered node
 * @param {string|null} nodeHovered The node's unique identifier
 */
export function toggleNodeHovered(nodeHovered) {
  return {
    type: TOGGLE_NODE_HOVERED,
    nodeHovered
  };
}

export const TOGGLE_NODE_METADATA_LOADING = 'TOGGLE_NODE_METADAT_LOADING';

/**
 * Toggle whether to display the loading spinner
 * @param {boolean} loading True if pipeline is still loading
 */
export function toggleLoading(loading) {
  return {
    type: TOGGLE_NODE_METADATA_LOADING,
    loading
  };
}

/**
 * Determine where to load data from
 */
export const getNodeMetadataUrl = nodeID => {
  return getUrl('node', nodeID);
};

/**
 * update node metadata on selection, loading new data if it has not been previously called
 * @param {string} nodeID Unique ID for selected node on graph
 * @return {function} A promise that resolves when the data is loaded
 */
export function loadNodeMetaData(nodeID) {
  return async function(dispatch, getState) {
    const { asyncDataSource, nodeID } = getState();

    if (asyncDataSource) {
      dispatch(toggleLoading(true));
      const url = getNodeMetadataUrl(nodeID);
      const newState = await loadJsonData(url).then(preparePipelineState);
      dispatch(resetData(newState));
      dispatch(toggleLoading(false));
    }
  };
}
