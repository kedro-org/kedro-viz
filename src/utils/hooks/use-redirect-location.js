import { useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../config';

const errorMessages = {
  node: 'Invalid node ID',
  modularPipeline: 'Invalid modular pipeline ID',
  pipeline: 'Invalid pipeline ID',
};

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

  const [errorMessage, setErrorMessage] = useState({});
  const [invalidUrl, setInvalidUrl] = useState(false);

  const activePipelineId = search.substring(
    search.indexOf(params.pipeline) + params.pipeline.length,
    search.indexOf('&')
  );

  const decodedPipelineId = decodeURI(activePipelineId);

  const matchedFlowchartMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.main],
  });

  const matchedSelectedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
  });

  const matchedFocusedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.focusedNode],
  });

  useEffect(() => {
    setErrorMessage({});
    setInvalidUrl(false);

    if (matchedFlowchartMainPage) {
      onLoadNodeData(null);
      onToggleFocusMode(null);
    }

    if (matchedSelectedNode && Object.keys(nodes).length > 0) {
      const nodeId = search.split(params.selected)[1];

      // Switching the view forces the page to reload again
      // hence this action needs to happen first
      onUpdateActivePipeline(decodedPipelineId);

      // Reset the focus mode to null when when using the navigation buttons
      onToggleFocusMode(null);

      // This timeout is to ensure it has enough time to
      // change to a different modular pipeline view first
      const switchingModularPipelineTimeout = setTimeout(() => {
        const existedNode = Object.keys(nodes).find((node) => node === nodeId);

        if (existedNode) {
          // then expanding modular pipeline (if there is one)
          const modularPipeline = nodes[nodeId];
          const hasModularPipeline = modularPipeline?.length > 0;
          if (hasModularPipeline) {
            onToggleModularPipelineExpanded(modularPipeline);
          }

          // then upload the node data
          onLoadNodeData(nodeId);
        } else {
          setErrorMessage(errorMessages.node);
          setInvalidUrl(true);
        }
      }, 400);

      return () => clearTimeout(switchingModularPipelineTimeout);
    }

    if (matchedFocusedNode && Object.keys(modularPipelinesTree).length > 0) {
      // Switching to a different modular pipeline view first
      onUpdateActivePipeline(decodedPipelineId);

      // Reset the node data to null when when using the navigation buttons
      onLoadNodeData(null);

      const modularPipelineId = search.split(params.focused)[1];
      const existedModularPipeline = modularPipelinesTree[modularPipelineId];

      if (existedModularPipeline) {
        onToggleFocusMode(existedModularPipeline.data);
        onToggleModularPipelineActive(modularPipelineId, true);
      } else {
        setErrorMessage(errorMessages.modularPipeline);
        setInvalidUrl(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search]);

  return { errorMessage, invalidUrl };
};
