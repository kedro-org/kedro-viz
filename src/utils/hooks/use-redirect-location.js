import { useCallback, useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params, tabLabels } from '../../config';

const errorMessages = {
  node: 'Please check the value of "selected_id" in the URL',
  modularPipeline: 'Please check the value of "focused_id" in the URL',
  pipeline: 'Please check the value of "pipeline_id" in the URL',
  run: 'Please check the value of "run_ids" in the URL',
};

/**
 * To trigger different actions based on the current location in the Flowchart.
 * This hook is only called when the page is reloaded or when the URL search changes.
 */
export const useRedirectLocationInFlowchart = (
  flags,
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

  const matchedSelectedNode = matchPath(pathname + search, {
    exact: true,
    path: [routes.flowchart.selectedNode],
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

      if (matchedSelectedNode && Object.keys(nodes).length > 0) {
        // Switching the view forces the page to reload again
        // hence this action needs to happen first
        updatePipeline(pipelines, decodedPipelineId);

        // Reset the focus mode to null when when using the navigation buttons
        onToggleFocusMode(null);

        const nodeId = search.split(params.selected)[1];
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

export const useRedirectLocationInExperimentTracking = (reload, allRunIds) => {
  const [enableComparisonView, setEnableComparisonView] = useState(false);
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  const [activeTab, setActiveTab] = useState(tabLabels[0]);
  const [errorMessage, setErrorMessage] = useState({});
  const [invalidUrl, setInvalidUrl] = useState(false);

  const { pathname, search } = useLocation();

  const matchedExperimentTrackingMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.experimentTracking.main],
  });

  const matchedSelectedRuns = matchPath(pathname + search, {
    exact: true,
    path: [routes.experimentTracking.selectedRuns],
  });

  useEffect(() => {
    // 1.match route
    // 2. check if ids existed
    // 3. check if the view is valid
    // 4. check if comparison mode is valid
    if (matchedSelectedRuns) {
      const runIds = search
        .substring(
          search.indexOf(params.run),
          search.indexOf(`&${params.view}`)
        )
        .split(params.run)[1];

      const runIdsArray = runIds.split(',');

      const view = search
        .substring(
          search.indexOf(params.view),
          search.indexOf(`&${params.comparisonMode}`)
        )
        .split(params.view)[1];

      // if there is more than 1 runId, the comparison mode should always be true
      const isComparison =
        runIdsArray.length > 1
          ? 'true'
          : search.split(params.comparisonMode)[1];

      setSelectedRunIds(runIdsArray);
      setEnableComparisonView(isComparison === 'true');
      setActiveTab(view);
    } else {
      setErrorMessage(errorMessages.run);
      setInvalidUrl(true);
    }

    if (matchedExperimentTrackingMainPage) {
      setErrorMessage({});
      setInvalidUrl(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search]);

  return {
    activeTab,
    enableComparisonView,
    errorMessage,
    invalidUrl,
    selectedRunIds,
    setActiveTab,
    setEnableComparisonView,
    setSelectedRunIds,
  };
};
