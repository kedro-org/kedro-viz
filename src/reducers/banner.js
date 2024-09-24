import { SET_BANNER } from '../actions';

function bannerReducer(bannerState = {}, action) {
  switch (action.type) {
    case SET_BANNER: {
      return Object.assign({}, bannerState, {
        [action.name]: action.value,
      });
    }

    default:
      return bannerState;
  }
}

export default bannerReducer;
