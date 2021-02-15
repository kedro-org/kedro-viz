import { createSelector } from 'reselect';

const getGraphLoading = (state) => state.loading.graph;
const getPipelineLoading = (state) => state.loading.pipeline;
const getFontLoading = (state) => !state.fontLoaded;
const getNodeLoading = (state) => state.loading.node;

/**
 * Determine whether to show the loading spinner
 */
export const isLoading = createSelector(
  [getGraphLoading, getPipelineLoading, getFontLoading, getNodeLoading],
  (graphLoading, pipelineLoading, fontLoading, nodeLoading) => {
    return graphLoading || pipelineLoading || fontLoading || nodeLoading;
  }
);
