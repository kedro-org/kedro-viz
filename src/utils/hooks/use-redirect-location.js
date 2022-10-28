import { useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../config';

const errorMessages = {
  node: 'The node ID is invalid',
  modularPipeline: 'The modular pipeline ID is invalid',
  pipeline: 'The pipeline ID is invalid',
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
  pipelines,
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
    } else {
      // Switching the view forces the page to reload again
      // hence this action needs to happen first
      const foundPipeline = pipelines.find((id) => id === decodedPipelineId);
      if (foundPipeline) {
        onUpdateActivePipeline(decodedPipelineId);

        if (matchedSelectedNode && Object.keys(nodes).length > 0) {
          // Reset the focus mode to null when when using the navigation buttons
          onToggleFocusMode(null);

          // This timeout is to ensure it has enough time to
          // change to a different modular pipeline view first
          const switchingModularPipelineTimeout = setTimeout(() => {
            const nodeId = search.split(params.selected)[1];
            const foundNode = Object.keys(nodes).find(
              (node) => node === nodeId
            );
            if (foundNode) {
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
          }, 500);

          return () => clearTimeout(switchingModularPipelineTimeout);
        }

        if (
          matchedFocusedNode &&
          Object.keys(modularPipelinesTree).length > 0
        ) {
          // Reset the node data to null when when using the navigation buttons
          onLoadNodeData(null);

          const switchingModularPipelineTimeout = setTimeout(() => {
            const modularPipelineId = search.split(params.focused)[1];
            onToggleModularPipelineActive(modularPipelineId, true);

            const foundModularPipeline =
              modularPipelinesTree[modularPipelineId];

            if (foundModularPipeline) {
              onToggleFocusMode(foundModularPipeline.data);
            } else {
              setErrorMessage(errorMessages.modularPipeline);
              setInvalidUrl(true);
            }
          }, 500);

          return () => clearTimeout(switchingModularPipelineTimeout);
        }
      } else {
        setErrorMessage(errorMessages.pipeline);
        setInvalidUrl(true);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search]);

  return { errorMessage, invalidUrl };
};
