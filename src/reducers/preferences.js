import { UPDATE_DATASET_PREVIEWS } from '../actions/preferences';

const initialState = true;

const showDatasetPreviews = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_DATASET_PREVIEWS:
      return action.payload.showDatasetPreviews;
    default:
      return state;
  }
};

export default showDatasetPreviews;
