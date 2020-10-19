import { createSelector } from 'reselect';

const getGraphLoading = state => state.loading.graph;
const getPipelineLoading = state => state.loading.pipeline;
const getFontLoading = state => !state.fontLoaded;

/**
 * Determine whether to show the loading spinner
 */
export const isLoading = createSelector(
  [getGraphLoading, getPipelineLoading, getFontLoading],
  (graphLoading, pipelineLoading, fontLoading) => {
    return graphLoading || pipelineLoading || fontLoading;
  }
);
