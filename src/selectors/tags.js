import { createSelector } from 'reselect';
import { getPipelineTagIDs } from './pipeline';

const getTagName = (state) => state.tag.name;
const getTagActive = (state) => state.tag.active;
const getTagEnabled = (state) => state.tag.enabled;

/**
 * Retrieve the formatted list of tag filters
 */
export const getTagData = createSelector(
  [getPipelineTagIDs, getTagName, getTagActive, getTagEnabled],
  (tagIDs, tagName, tagActive, tagEnabled) =>
    tagIDs.sort().map((id) => ({
      id,
      name: tagName[id],
      active: Boolean(tagActive[id]),
      enabled: Boolean(tagEnabled[id]),
    }))
);

/**
 * Get the total and enabled number of tags
 */
export const getTagCount = createSelector(
  [getPipelineTagIDs, getTagEnabled],
  (tagIDs, tagEnabled) => ({
    total: tagIDs.length,
    enabled: tagIDs.filter((id) => tagEnabled[id]).length,
  })
);
