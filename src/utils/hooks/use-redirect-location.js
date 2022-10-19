import { useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../routes.config';

export const useRedirectLocation = (
  modularPipelinesTree,
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

  const matchedExpandedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.expandedNode],
  });

  useMemo(() => {
    if (matchedSelectedNode) {
      const nodeId = search.split(params.selected)[1];

      onUpdateActivePipeline(decodedPipelineId);
      onLoadNodeData(nodeId);
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length !== 0) {
      const modularPipelineId = search.split(params.focused)[1];
      const modularPipeline = modularPipelinesTree[modularPipelineId];

      onToggleFocusMode(modularPipeline.data);
      onToggleModularPipelineActive(modularPipelineId, true);
      onUpdateActivePipeline(decodedPipelineId);
    }

    if (matchedExpandedNode) {
      const expandedId = search.substring(
        search.indexOf(params.expanded) + params.expanded.length,
        search.lastIndexOf('&')
      );
      const selectedId = search.split(params.selected)[1];

      onToggleModularPipelineExpanded([expandedId]);
      onLoadNodeData(selectedId);
      onUpdateActivePipeline(decodedPipelineId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);
};
