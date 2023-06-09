import { useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { routes, errorMessages, tabLabels } from '../../config';
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
