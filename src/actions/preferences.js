import { fetchPreferences } from '../utils/preferences-api';

// Action Types
export const UPDATE_DATASET_PREVIEWS = 'UPDATE_DATASET_PREVIEWS';

// Action Creators
export const updateDatasetPreviews = (showDatasetPreviews) => ({
  type: UPDATE_DATASET_PREVIEWS,
  payload: { showDatasetPreviews },
});

export const getPreferences = () => async (dispatch) => {
  try {
    const preferences = await fetchPreferences();
    dispatch(updateDatasetPreviews(preferences.showDatasetPreviews));
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
};
