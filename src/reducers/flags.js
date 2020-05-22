import { CHANGE_FLAG } from '../actions';

function flagsReducer(flagsState = {}, action) {
  switch (action.type) {
    case CHANGE_FLAG: {
      return Object.assign({}, flagsState, {
        flags: {
          ...flagsState,
          [action.name]: action.value
        }
      });
    }

    default:
      return flagsState;
  }
}

export default flagsReducer;
