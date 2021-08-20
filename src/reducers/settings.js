import { TOGGLE_SETTINGS } from '../actions';

function settingsReducer(settingsState = {}, action) {
  switch (action.type) {
    case TOGGLE_SETTINGS: {
      return Object.assign({}, settingsState, {
        [action.name]: action.value,
      });
    }

    default:
      return settingsState;
  }
}

export default settingsReducer;
