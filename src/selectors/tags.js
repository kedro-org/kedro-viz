import { createSelector } from 'reselect';
import { getActivePipelineData } from './index';

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
 * Generate the label for the tag dropdown
 * @param {Array} tags List of tag objects
 * @return {string} Label text
 */
export const getTagLabel = createSelector(
  [getTags],
  tags => {
    const totalTabCount = tags.length;
    const activeTabCount = tags.filter(d => !d.disabled).length;
    const tagCount = activeTabCount < totalTabCount ? `${activeTabCount}/${totalTabCount}` : 'all';
    return `Tags (${tagCount})`;
  }
);