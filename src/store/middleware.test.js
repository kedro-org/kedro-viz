import createCallbackMiddleware from './middleware';

describe('createCallbackMiddleware', () => {
  let store;
  let next;
  let callback;
  let middleware;

  beforeEach(() => {
    store = {
      getState: jest.fn(),
    };
    next = jest.fn();
    callback = jest.fn();
    middleware = createCallbackMiddleware(callback)(store)(next);
  });

  it('should call the callback with the correct node when action type is TOGGLE_NODE_CLICKED and node is found', () => {
    const nodeClicked = '123';
    const node = { id: nodeClicked, name: 'Node 123' };
    const nodeClickAction = { type: 'TOGGLE_NODE_CLICKED', payload: node };
    const action = { type: 'TOGGLE_NODE_CLICKED', nodeClicked };

    store.getState.mockReturnValue({
      graph: {
        nodes: [node],
      },
    });

    middleware(action);

    expect(callback).toHaveBeenCalledWith(nodeClickAction);
    expect(next).toHaveBeenCalledWith(action);
  });

  it('should not call the callback if action type is different', () => {
    const action = { type: 'OTHER_ACTION', nodeClicked: '123' };

    middleware(action);

    expect(callback).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  it('should not call the callback if node is not found', () => {
    const action = { type: 'TOGGLE_NODE_CLICKED', nodeClicked: '123' };

    store.getState.mockReturnValue({
      graph: {
        nodes: [{ id: '456', name: 'Node 456' }],
      },
    });

    middleware(action);

    expect(callback).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  it('should not call the callback if callback is not provided', () => {
    middleware = createCallbackMiddleware(null)(store)(next);
    const action = { type: 'TOGGLE_NODE_CLICKED', nodeClicked: '123' };

    store.getState.mockReturnValue({
      graph: {
        nodes: [{ id: '123', name: 'Node 123' }],
      },
    });

    middleware(action);

    expect(next).toHaveBeenCalledWith(action);
  });
});
