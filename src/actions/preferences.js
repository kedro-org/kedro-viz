import { fetchPreferences } from '../utils/preferences-api';

// Action Types
export const PREFERENCES_LOADED = '[Preferences] loaded';

// Action Creators
export const preferencesLoaded = (preferences) => ({
  type: PREFERENCES_LOADED,
  payload: preferences,
});

export const getPreferences = () => async (dispatch) => {
  try {
    const preferences = await fetchPreferences();
    dispatch(preferencesLoaded(preferences));
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
};
