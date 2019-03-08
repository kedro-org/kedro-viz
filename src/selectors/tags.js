import { createSelector } from 'reselect';
import { getActivePipelineData } from './index';

/**
 * Retrieve the unformatted list of tags
 * @param {Object} pipeline Active pipeline data
 * @return {Array} Tag data list
 */
export const getPipelineTags = createSelector(
  [getActivePipelineData],
  (pipeline) => {
    return pipeline.tags
  }
);

/**
 * Retrieve the formatted list of tag filters
 * @param {Object} tags Active pipeline tag data
 * @return {Array} Tag data list
 */
export const getTags = createSelector(
  [getPipelineTags],
  tags => {
    if (tags) {
      return tags.allIDs
        .sort()
        .map(id => ({
          id,
          name: id.replace(/_/g, ' '),
          active: tags.active[id],
          enabled: Boolean(tags.enabled[id]),
        }));
    }
    return null;
  }
);

/**
 * Get the total and enabled number of tags
 * @param {Array} tags List of tag objects
 * @return {Object} total / enabled tags
 */
export const getTagCount = createSelector(
  [getTags],
  tags => {
    if (tags) {
      return {
        total: tags.length,
        enabled: tags.filter(d => d.enabled).length,
      };
    }
    return {
      total: null,
      enabled: null,
    };
  }
);