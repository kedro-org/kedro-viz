import { TOGGLE_NODE_CLICKED, NODE_CONTEXT_MENU } from '../actions/nodes';
import { SHOW_PIPELINE_FILTER } from '../actions';

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
      case SHOW_PIPELINE_FILTER:
        const showPipelineFilterAction = {
          type: SHOW_PIPELINE_FILTER,
        };
        callback(showPipelineFilterAction);
        break;
      case NODE_CONTEXT_MENU:
        if (action.nodeId) {
          const state = store.getState();
          const node = state?.graph?.nodes?.find(
            (node) => node.id === action.nodeId
          );
          if (node) {
            const contextMenuAction = {
              type: NODE_CONTEXT_MENU,
              payload: node,
            };
            callback(contextMenuAction);
          }
        }
        break;
      default:
        break;
    }
    return next(action);
  };

export default createCallbackMiddleware;
