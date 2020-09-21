import { createSelector } from 'reselect';

const getGraphLoading = state => state.graph.loading;
const getPipelineLoading = state => state.pipeline.loading;
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
