import { UPDATE_USER_PREFERENCES } from '../actions/preferences';

const initialState = {
  showDatasetPreviews: true,
};

const userPreferences = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_USER_PREFERENCES:
      return {
        ...state,
        showDatasetPreviews: action.payload.preferences.showDatasetPreviews,
      };
    default:
      return state;
  }
};

export default userPreferences;
