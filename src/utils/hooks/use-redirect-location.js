import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../config';

/**
 * To trigger different actions based on the current location in the Flowchart.
 * This hook is only called when the page is reloaded.
 */
export const useRedirectLocationInFlowchart = (
  modularPipelinesTree,
  nodes,
  onLoadNodeData,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  onUpdateActivePipeline,
  reload
) => {
  const { pathname, search } = useLocation();

  const activePipelineId = search.substring(
    search.indexOf(params.pipeline) + params.pipeline.length,
    search.indexOf('&')
  );

  const decodedPipelineId = decodeURI(activePipelineId);

  const matchedSelectedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
  });

  const matchedFocusedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.focusedNode],
  });

  useEffect(() => {
    if (matchedSelectedNode && Object.keys(nodes).length > 0) {
      const nodeId = search.split(params.selected)[1];

      // Switching the view forces the page to reload again
      // hence this action needs to happen first
      onUpdateActivePipeline(decodedPipelineId);

      // This timeout is to ensure it has enough time to
      // change to a different modular pipeline view first
      const switchingModularPipelineTimeout = setTimeout(() => {
        // then expanding modular pipeline (if there is one)
        const modularPipeline = nodes[nodeId];
        const hasModularPipeline = modularPipeline?.length > 0;
        if (hasModularPipeline) {
          onToggleModularPipelineExpanded(modularPipeline);
        }

        // then upload the node data
        onLoadNodeData(nodeId);
      }, 400);

      return () => clearTimeout(switchingModularPipelineTimeout);
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length > 0) {
      // Switching to a different modular pipeline view first
      onUpdateActivePipeline(decodedPipelineId);

      const modularPipelineId = search.split(params.focused)[1];
      const modularPipeline = modularPipelinesTree[modularPipelineId];

      onToggleFocusMode(modularPipeline.data);
      onToggleModularPipelineActive(modularPipelineId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);
};
