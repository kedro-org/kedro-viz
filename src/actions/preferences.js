import { fetchPreferences } from '../utils/preferences-api';

// Action Types
export const PREFERENCES_LOADED = 'PREFERENCES_LOADED';
export const TOGGLE_SHOW_DATASET_PREVIEWS = 'TOGGLE_SHOW_DATASET_PREVIEWS';

// Action Creators
export const preferencesLoaded = (preferences) => ({
  type: PREFERENCES_LOADED,
  payload: preferences,
});

export const toggleShowDatasetPreviews = (showDatasetPreviews) => ({
  type: TOGGLE_SHOW_DATASET_PREVIEWS,
  showDatasetPreviews,
});

export const getPreferences = () => async (dispatch) => {
  try {
    const preferences = await fetchPreferences();
    dispatch(preferencesLoaded(preferences));
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
};
