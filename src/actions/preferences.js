import { fetchPreferences } from '../utils/preferences-api';

// Action Types
export const UPDATE_USER_PREFERENCES = 'UPDATE_USER_PREFERENCES';

// Action Creators
export const updateUserPreferences = (preferences) => ({
  type: UPDATE_USER_PREFERENCES,
  payload: preferences,
});

export const getPreferences = () => async (dispatch) => {
  try {
    const preferences = await fetchPreferences();
    dispatch(updateUserPreferences(preferences));
  } catch (error) {
    console.error('Error fetching preferences:', error);
  }
};
