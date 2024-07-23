// src/reducers/preferences.js

import { PREFERENCES_LOADED } from '../actions/preferences';

const initialState = {
  showDatasetPreviews: true, // default value
};

const preferencesReducer = (state = initialState, action) => {
  switch (action.type) {
    case PREFERENCES_LOADED:
      return {
        ...state,
        showDatasetPreviews: action.payload.showDatasetPreviews,
      };
    default:
      return state;
  }
};

export default preferencesReducer;
