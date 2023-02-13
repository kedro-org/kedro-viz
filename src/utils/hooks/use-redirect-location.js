import { useCallback, useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params } from '../../config';

const errorMessages = {
  node: 'Please check the value of "selected_id" in the URL',
  nodeName: 'Please check the value of "selected_name" in the URL',
  modularPipeline: 'Please check the value of "focused_id" in the URL',
  pipeline: 'Please check the value of "pipeline_id" in the URL',
};

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};

/**
 * To trigger different actions based on the current location in the Flowchart.
 * This hook is only called when the page is reloaded or when the URL search changes.
 */
export const useRedirectLocationInFlowchart = (
  flags,
  fullNames,
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
  const [pageReloaded, setPageReloaded] = useState(false);

  const activePipelineId = search.substring(
    search.indexOf(params.pipeline) + params.pipeline.length,
    search.indexOf('&')
  );

  const decodedPipelineId = decodeURI(activePipelineId);

  const matchedFlowchartMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.main],
  });

  const matchedSelectedNodeId = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
  });

  const matchedSelectedNodeName = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedName],
  });

  const matchedFocusedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.focusedNode],
  });

  const updatePipeline = useCallback(
    (pipelines, decodedPipelineId) => {
      const foundPipeline = pipelines.find((id) => id === decodedPipelineId);

      if (foundPipeline) {
        onUpdateActivePipeline(decodedPipelineId);
      } else {
        setErrorMessage(errorMessages.pipeline);
        setInvalidUrl(true);
      }
    },
    [onUpdateActivePipeline]
  );

  const redirectToSelectedNode = (nodeId) => {
    // Switching the view forces the page to reload again
    // hence this action needs to happen first
    updatePipeline(pipelines, decodedPipelineId);

    // Reset the focus mode to null when when using the navigation buttons
    onToggleFocusMode(null);

    const foundNode = Object.keys(nodes).find((node) => node === nodeId);
    if (foundNode) {
      const modularPipeline = nodes[nodeId];
      const hasModularPipeline = modularPipeline?.length > 0;

      // For when the user toggles Expand all modular pipelines button
      // then we don't need to call this action
      if (!flags.expandAllPipelines && hasModularPipeline) {
        onToggleModularPipelineExpanded(modularPipeline);
      }

      // then upload the node data
      onLoadNodeData(nodeId);
    } else {
      setErrorMessage(errorMessages.node);
      setInvalidUrl(true);
    }
  };

  useEffect(() => {
    if (reload) {
      setPageReloaded(true);
    }

    // This timeout is to ensure it has enough time to
    // load the data after the page is reloaded
    // or change to a different modular pipeline view first
    const setPageReloadedTimeOut = setTimeout(() => {
      pageReloaded && setPageReloaded(false);
    }, 500);

    return () => clearTimeout(setPageReloadedTimeOut);
  }, [pageReloaded, reload]);

  useEffect(() => {
    if (pageReloaded) {
      setErrorMessage({});
      setInvalidUrl(false);

      if (matchedFlowchartMainPage) {
        onLoadNodeData(null);
        onToggleFocusMode(null);
      }

      if (matchedSelectedNodeName) {
        const nodeName = search.split(params.selectedName)[1];
        const decodedNodeName = decodeURI(nodeName).replace(/['"]+/g, '');
        const foundNodeId = getKeyByValue(fullNames, decodedNodeName);

        if (foundNodeId) {
          redirectToSelectedNode(foundNodeId);
        } else {
          setErrorMessage(errorMessages.nodeName);
          setInvalidUrl(true);
        }
      }

      if (matchedSelectedNodeId && Object.keys(nodes).length > 0) {
        const nodeId = search.split(params.selected)[1];

        redirectToSelectedNode(nodeId);
      }

      if (matchedFocusedNode && Object.keys(modularPipelinesTree).length > 0) {
        updatePipeline(pipelines, decodedPipelineId);

        // Reset the node data to null when when using the navigation buttons
        onLoadNodeData(null);

        const modularPipelineId = search.split(params.focused)[1];

        const foundModularPipeline = modularPipelinesTree[modularPipelineId];

        if (foundModularPipeline) {
          onToggleModularPipelineActive(modularPipelineId, true);
          onToggleFocusMode(foundModularPipeline.data);
        } else {
          setErrorMessage(errorMessages.modularPipeline);
          setInvalidUrl(true);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search]);

  return { errorMessage, invalidUrl };
};
