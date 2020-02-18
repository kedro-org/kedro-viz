import { createSelector } from 'reselect';

const getTagIDs = state => state.tag.ids;
const getTagName = state => state.tag.name;
const getTagActive = state => state.tag.active;
const getTagEnabled = state => state.tag.enabled;

/**
 * Retrieve the formatted list of tag filters
 * @param {Object} tags Active pipeline tag data
 * @return {Array} Tag data list
 */
export const getTagData = createSelector(
  [getTagIDs, getTagName, getTagActive, getTagEnabled],
  (tags, tagName, tagActive, tagEnabled) =>
    tags.sort().map(id => ({
      id,
      name: tagName[id],
      active: Boolean(tagActive[id]),
      enabled: Boolean(tagEnabled[id])
    }))
);

/**
 * Get the total and enabled number of tags
 * @param {Array} tags List of tag objects
 * @return {Object} total / enabled tags
 */
export const getTagCount = createSelector(
  [getTagIDs, getTagEnabled],
  (tags, tagEnabled) => ({
    total: tags.length,
    enabled: tags.filter(id => tagEnabled[id]).length
  })
);
