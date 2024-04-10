import { useCallback } from 'react';
import { useHistory, generatePath } from 'react-router-dom';
import {
  localStorageName,
  params,
  routes,
  defaultQueryParams,
  NODE_TYPES,
} from '../../config';
import { mapNodeType } from '../../utils';

const getCurrentActivePipeline = () => {
  const localStorage = window.localStorage.getItem(localStorageName);
  return JSON.parse(localStorage)?.pipeline?.active;
};

/**
 * Retains default query parameters and removes all others from the given searchParams object.
 * @param {URLSearchParams} searchParams - The searchParams object to modify.
 */
const retainDefaultQueryParams = (searchParams) => {
  const searchParamsEntries = [...searchParams.keys()];

  for (const key of searchParamsEntries) {
    if (!defaultQueryParams.includes(key)) {
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

  /**
   * Updates the URL with search parameters based on the provided update function.
   * @param {Function} updateFunction - The function that updates the search parameters.
   */
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
    updateURLWithSearchParams(retainDefaultQueryParams);
  }, [updateURLWithSearchParams]);

  const toSelectedPipeline = useCallback(
    (pipelineValue) => {
      updateURLWithSearchParams((searchParams) => {
        retainDefaultQueryParams(searchParams);

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
    (item) => {
      updateURLWithSearchParams((searchParams) => {
        searchParams.set(params.selected, item.id);
      });
    },
    [updateURLWithSearchParams]
  );

  const toFocusedModularPipeline = useCallback(
    (item) => {
      updateURLWithSearchParams((searchParams) => {
        searchParams.set(params.focused, item.id);
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

  const toUpdateUrlParamsOnResetFilter = useCallback(() => {
    updateURLWithSearchParams((searchParams) => {
      searchParams.delete(params.tags);
      searchParams.set(
        params.types,
        `${NODE_TYPES.task.name},${NODE_TYPES.data.name}`
      );
    });
  }, [updateURLWithSearchParams]);

  const toUpdateUrlParamsOnFilter = (item, paramName, existingValues) => {
    const mapItemId = mapNodeType(item.id);
    if (item.checked) {
      existingValues.delete(mapItemId);
    } else {
      existingValues.add(mapItemId);
    }

    toSetQueryParam(paramName, Array.from(existingValues));
  };

  return {
    toSelectedPipeline,
    toFlowchartPage,
    toSelectedNode,
    toFocusedModularPipeline,
    toSetQueryParam,
    toUpdateUrlParamsOnResetFilter,
    toUpdateUrlParamsOnFilter,
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
