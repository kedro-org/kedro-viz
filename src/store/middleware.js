const createCallbackMiddleware =
  (callback) => (store) => (next) => (action) => {
    if (
      action.type === 'TOGGLE_NODE_CLICKED' &&
      action.nodeClicked &&
      callback
    ) {
      const state = store.getState();
      const node = state?.graph?.nodes?.find(
        (node) => node.id === action.nodeClicked
      );
      if (node) {
        callback(node);
      }
    }
    return next(action);
  };

export default createCallbackMiddleware;
