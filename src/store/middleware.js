import { TOGGLE_NODE_CLICKED } from '../actions/nodes';

/**
 * Middleware to handle custom callback actions in the Redux store.
 *
 * This middleware intercepts actions dispatched to the Redux store and checks for the action type.
 * If the action type matches and callback function is provided,
 * Then it invokes the provided callback function with type and payload.
 *
 * @param {Function} callback - The callback function to be invoked when the specified action is dispatched.
 * @returns {Function} - A middleware function to be used in the Redux store.
 */
const createCallbackMiddleware =
  (callback) => (store) => (next) => (action) => {
    if (!callback) {
      return next(action);
    }

    switch (action.type) {
      case TOGGLE_NODE_CLICKED:
        if (action.nodeClicked) {
          const state = store.getState();
          const node = state?.graph?.nodes?.find(
            (node) => node.id === action.nodeClicked
          );
          if (node) {
            const nodeClickAction = {
              type: TOGGLE_NODE_CLICKED,
              payload: node,
            };
            callback(nodeClickAction);
          }
        }
        break;
      /** 
      * Add additional cases here to handle other action types.
      * Ensure on whatever action you want to trigger, It should be a Redux action. 
      * And payload should be in Redux state.
      * Example:
      * const action = { type: SLICE_PIPELINE, payload: runCommand };
        callback(action);
      */
      default:
        break;
    }
    return next(action);
  };

export default createCallbackMiddleware;
