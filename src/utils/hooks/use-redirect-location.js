import { useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../routes.config';

export const useRedirectLocation = (
  modularPipelinesTree,
  onLoadNodeData,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  reload
) => {
  const { pathname, search } = useLocation();

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
      const nodeId = search.split(params.selected);

      onLoadNodeData(nodeId[1]);
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length !== 0) {
      const modularPipelineId = search.split(params.focused);
      const modularPipeline = modularPipelinesTree[modularPipelineId[1]];

      onToggleFocusMode(modularPipeline.data);
      onToggleModularPipelineActive(modularPipelineId[1], true);
    }

    if (matchedExpandedNode) {
      const expandedId = search.substring(
        search.indexOf(params.expanded) + params.expanded.length,
        search.lastIndexOf('/')
      );

      const selectedId = search.split(params.selected);

      onToggleModularPipelineExpanded([expandedId]);
      onLoadNodeData(selectedId[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);
};
