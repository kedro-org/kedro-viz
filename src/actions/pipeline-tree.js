import { getUrl } from '../utils';
import loadJsonData from '../store/load-data';
import { preparePipelineState } from '../store/initial-state';
import { resetData, toggleGraph } from './index';
import { toggleLoading, updateActivePipeline } from './pipelines';

export const CHECK_TREE_NODE = 'CHECK_TREE_NODE';

function checkTreeNode(checked) {
  return {
    type: CHECK_TREE_NODE,
    checked
  };
}

function getPipelineTreeUrl(pipelines = '') {
  let type = 'main';
  let id = '';
  if (pipelines) {
    id = pipelines;
    type = 'tree';
  }
  return getUrl(type, id);
}

export const EXPAND_TREE_NODE = 'EXPAND_TREE_NODE';

export function expandTreeNode(expanded) {
  return {
    type: EXPAND_TREE_NODE,
    expanded
  };
}

export function loadPipelineTreeData(checked) {
  return async function(dispatch, getState) {
    const { asyncDataSource, pipelineTree } = getState();
    if (pipelineTree.checked === checked) {
      return;
    }
    const pipelineID = checked.join(',');
    if (asyncDataSource) {
      dispatch(toggleLoading(true));
      // Remove the previous graph to show that a new pipeline is being loaded
      dispatch(toggleGraph(false));
      const url = getPipelineTreeUrl(pipelineID);

      const newState = await loadJsonData(url).then(preparePipelineState);
      // Set active pipeline here rather than dispatching two separate actions,
      // to improve performance by only requiring one state recalculation
      newState.pipeline.active = pipelineID;
      newState.pipelineTree.expanded = pipelineTree.expanded;
      dispatch(resetData(newState));
      dispatch(toggleLoading(false));
    } else {
      dispatch(updateActivePipeline(pipelineID));
    }
    dispatch(checkTreeNode(checked));
  };
}
