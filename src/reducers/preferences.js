import { UPDATE_PREFERENCES } from '../actions';

const initialState = {
  showDatasetPreviews: true,
};

const preferencesReducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_PREFERENCES:
      return {
        ...state,
        ...action.preferences,
      };
    default:
      return state;
  }
};

export default preferencesReducer;
