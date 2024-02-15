import { useCallback } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import {
  localStorageName,
  params,
  routes,
  queryParamsToRetain,
} from '../../config';

const getCurrentActivePipeline = () => {
  const localStorage = window.localStorage.getItem(localStorageName);
  return JSON.parse(localStorage)?.pipeline?.active;
};

const retainOtherQueryParams = (searchParams) => {
  const searchParamsEntries = [...searchParams.keys()];

  for (const key of searchParamsEntries) {
    if (!queryParamsToRetain.includes(key)) {
      searchParams.delete(key);
    }
  }
};

/**
 * To generate different pathnames based on each action
 * E.g.: click on a node, or focus on a modular pipeline
 * or to reset the pathname to the main page
 */
export const useGeneratePathname = () => {
  const history = useHistory();

  const updateURLWithSearchParams = useCallback(
    (updateFunction) => {
      const searchParams = new URLSearchParams(history.location.search);
      updateFunction(searchParams);
      const url = decodeURIComponent(
        history.location.pathname + '?' + searchParams.toString()
      );
      history.push(url);
    },
    [history]
  );

  const toFlowchartPage = useCallback(() => {
    updateURLWithSearchParams(retainOtherQueryParams);
  }, [updateURLWithSearchParams]);

  const toSelectedPipeline = useCallback(
    (pipelineValue) => {
      updateURLWithSearchParams((searchParams) => {
        retainOtherQueryParams(searchParams);

        // Get the value from param if it exists first
        // before checking from localStorage
        const activePipeline = pipelineValue
          ? pipelineValue
          : getCurrentActivePipeline();
        searchParams.set(params.pipeline, activePipeline);
      });
    },
    [updateURLWithSearchParams]
  );

  const toSelectedNode = useCallback(
    (node) => {
      updateURLWithSearchParams((searchParams) => {
        const activePipeline = getCurrentActivePipeline();
        searchParams.set(params.pipeline, activePipeline);
        searchParams.set(params.selected, node.id);
      });
    },
    [updateURLWithSearchParams]
  );

  const toFocusedModularPipeline = useCallback(
    (pipeline) => {
      updateURLWithSearchParams((searchParams) => {
        const activePipeline = getCurrentActivePipeline();
        searchParams.set(params.pipeline, activePipeline);
        searchParams.set(params.focused, pipeline.id);
      });
    },
    [updateURLWithSearchParams]
  );

  const toSetQueryParam = useCallback(
    (param, value) => {
      updateURLWithSearchParams((searchParams) => {
        if (Array.isArray(value) && value.length === 0) {
          searchParams.delete(param);
        } else {
          searchParams.set(param, value);
        }
      });
    },
    [updateURLWithSearchParams]
  );

  return {
    toSelectedPipeline,
    toFlowchartPage,
    toSelectedNode,
    toFocusedModularPipeline,
    toSetQueryParam,
  };
};

export const useGeneratePathnameForExperimentTracking = () => {
  const history = useHistory();

  const toExperimentTrackingPath = useCallback(() => {
    const url = generatePath(routes.experimentTracking.main);

    history.push(url);
  }, [history]);

  const toMetricsViewPath = useCallback(() => {
    const url = generatePath(routes.experimentTracking.selectedView, {
      view: 'Metrics',
    });
    history.push(url);
  }, [history]);

  const toSelectedRunsPath = useCallback(
    (ids, view, isComparison) => {
      const url = generatePath(routes.experimentTracking.selectedRuns, {
        ids: ids.length === 1 ? ids[0] : ids.toString(),
        view,
        isComparison,
      });

      history.push(url);
    },
    [history]
  );

  return {
    toExperimentTrackingPath,
    toMetricsViewPath,
    toSelectedRunsPath,
  };
};
