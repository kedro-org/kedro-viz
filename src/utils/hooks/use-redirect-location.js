import { useCallback, useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, params, tabLabels } from '../../config';
import { useGeneratePathnameForExperimentTracking } from './use-generate-pathname';

/**
 * If the view from URL is not matched the tabLabels then set the default
 * value to be the first one from tabLabels
 * @param {object} searchParams
 * @returns string
 */
const getDefaultTabLabel = (searchParams) => {
  return tabLabels.includes(searchParams.view)
    ? searchParams.view
    : tabLabels[0];
};

const errorMessages = {
  node: 'Please check the value of "selected_id" in the URL',
  modularPipeline: 'Please check the value of "focused_id" in the URL',
  pipeline: 'Please check the value of "pipeline_id" in the URL',
  experimentTracking: `Please check the spelling of "run_ids" or "view" or "comparison" in the URL. It may be a typo 😇`,
  runIds: `Please check the value of "run_ids" in the URL. Perhaps you've deleted the entity 🙈 or it may be a typo 😇`,
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

export const useRedirectLocationInExperimentTracking = (data, reload) => {
  const [enableComparisonView, setEnableComparisonView] = useState(false);
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  const [activeTab, setActiveTab] = useState(tabLabels[0]);
  const [errorMessage, setErrorMessage] = useState({});
  const [invalidUrl, setInvalidUrl] = useState(false);

  const { pathname, search } = useLocation();
  const { toSelectedRunsPath } = useGeneratePathnameForExperimentTracking();

  const matchedExperimentTrackingMainPage = matchPath(pathname + search, {
    exact: true,
    path: [routes.experimentTracking.main],
  });

  const matchedSelectedView = matchPath(pathname + search, {
    exact: true,
    path: [routes.experimentTracking.selectedView],
  });

  const matchedSelectedRuns = matchPath(pathname + search, {
    exact: true,
    path: [routes.experimentTracking.selectedRuns],
  });

  useEffect(() => {
    if (
      !matchedExperimentTrackingMainPage &&
      !matchedSelectedRuns &&
      !matchedSelectedView
    ) {
      setErrorMessage(errorMessages.experimentTracking);
      setInvalidUrl(true);
    }

    if (matchedExperimentTrackingMainPage) {
      if (data?.runsList.length > 0 && selectedRunIds.length === 0) {
        setErrorMessage({});
        setInvalidUrl(false);

        /**
         * If we return runs and don't yet have a selected run, set the first one
         * as the default, with precedence given to runs that are bookmarked.
         */
        const bookmarkedRuns = data.runsList.filter((run) => {
          return run.bookmark === true;
        });

        if (bookmarkedRuns.length > 0) {
          const defaultRunFromBookmarked = bookmarkedRuns
            .map((run) => run.id)
            .slice(0, 1);

          setSelectedRunIds(defaultRunFromBookmarked);
          toSelectedRunsPath(
            defaultRunFromBookmarked,
            activeTab,
            enableComparisonView
          );
        } else {
          const defaultRun = data.runsList.map((run) => run.id).slice(0, 1);

          setSelectedRunIds(defaultRun);
          toSelectedRunsPath(defaultRun, activeTab, enableComparisonView);
        }
      }
    }

    if (matchedSelectedRuns && data) {
      const { params: searchParams } = matchedSelectedRuns;
      const runIdsArray = searchParams.ids.split(',');
      const allRunIds = data?.runsList.map((run) => run.id);
      const notFoundIds = runIdsArray.find((id) => !allRunIds?.includes(id));

      // Extra check if the ids from URL are not existed
      if (notFoundIds) {
        setErrorMessage(errorMessages.runIds);
        setInvalidUrl(true);
      } else {
        const view = getDefaultTabLabel(searchParams);
        const isComparison =
          runIdsArray.length > 1 ? true : searchParams.isComparison === 'true';

        setSelectedRunIds(runIdsArray);
        setEnableComparisonView(isComparison);
        setActiveTab(view);
      }
    }

    /**
     * This is for when there's only view= is defined in the URL, without any run_ids
     * it should re-direct to the latest run
     */
    if (matchedSelectedView && data) {
      const { params } = matchedSelectedView;
      const latestRun = data.runsList.map((run) => run.id).slice(0, 1);
      const view = getDefaultTabLabel(params);

      setSelectedRunIds(latestRun);
      setEnableComparisonView(false);
      setActiveTab(view);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, search, pathname]);

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
