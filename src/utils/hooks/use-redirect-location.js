import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../routes.config';

/**
 * to trigger different actions based on the current location in the flowchart
 * and this hook is only called when the page is reload
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

      const modularPipeline = nodes[nodeId];
      const hasModularPipeline = modularPipeline.length > 0;

      if (hasModularPipeline) {
        onToggleModularPipelineExpanded(modularPipeline);
        onUpdateActivePipeline(decodedPipelineId);
        onLoadNodeData(nodeId);
      } else {
        onLoadNodeData(nodeId);
        onUpdateActivePipeline(decodedPipelineId);
      }
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length > 0) {
      const modularPipelineId = search.split(params.focused)[1];
      const modularPipeline = modularPipelinesTree[modularPipelineId];

      onToggleFocusMode(modularPipeline.data);
      onToggleModularPipelineActive(modularPipelineId, true);
      onUpdateActivePipeline(decodedPipelineId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);
};
