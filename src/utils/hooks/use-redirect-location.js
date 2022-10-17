import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes } from '../../routes.config';

export const useRedirectLocation = (
  modularPipelinesTree,
  onLoadNodeData,
  onToggleFocusMode,
  onToggleModularPipelineActive
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

  useEffect(() => {
    if (matchedSelectedNode) {
      const nodeId = search.split('_id=');

      onLoadNodeData(nodeId[1]);
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length !== 0) {
      debugger;
      const modularPipelineId = search.split('_id=');
      const modularPipeline = modularPipelinesTree[modularPipelineId[1]];

      onToggleFocusMode(modularPipeline.data);

      onToggleModularPipelineActive(modularPipelineId[1], true);
    }
  }, [
    matchedSelectedNode,
    matchedFocusedNode,
    search,
    onLoadNodeData,
    modularPipelinesTree,
    onToggleFocusMode,
    onToggleModularPipelineActive,
  ]);
};
