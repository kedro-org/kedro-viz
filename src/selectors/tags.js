import { createSelector } from 'reselect';
import { getActivePipelineData } from './index';

/**
 * Retrieve the formatted list of tags
 * @param {Object} pipeline Active pipeline data
 * @return {Array} Tag data list
 */
export const getTags = createSelector(
  [getActivePipelineData],
  ({ tags }) => tags.allIDs.sort().map(id => ({
    id,
    name: id.replace(/_/g, ' '),
    active: tags.active[id],
    disabled: tags.disabled[id],
  }))
);

/**
 * Get the total and visible number of tags
 * @param {Array} tags List of tag objects
 * @return {Object} total / visible tags
 */
export const getTagCount = createSelector(
  [getTags],
  tags => ({
    total: tags.length,
    visible: tags.filter(d => !d.disabled).length,
  })
);