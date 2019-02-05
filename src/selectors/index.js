import { createSelector } from 'reselect';

const getActivePipelineData = (state) => state.activePipelineData;

export const getTags = createSelector(
  [getActivePipelineData],
  (activePipelineData) => {
    const tags = activePipelineData.tags;
    return Object.keys(tags)
      .sort()
      .map(tagID => ({
        id: tagID,
        name: tagID.replace(/_/g, ' '),
        disabled: !tags[tagID]
      }));
  }
);