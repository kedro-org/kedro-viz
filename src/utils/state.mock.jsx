import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import getInitialState from '../store/initial-state';
import spaceflights from './data/spaceflights.mock.json';
import spaceflightsReordered from './data/spaceflights_reordered.mock.json';
import demo from './data/demo.mock.json';
import rootReducer from '../reducers';
import { getGraphInput } from '../selectors/layout';
import { updateGraph } from '../actions/graph';
import { graphNew } from './graph';

/**
 * Prime the state object for the testing environment
 * by running the asynchronous actions synchronously.
 * Optionally apply additional actions before or after layout.
 * @param {Object} props
 * @param {?Function[]} props.beforeLayoutActions Functions that return actions to reduce before layout
 * @param {?Function[]} props.afterLayoutActions Functions that return actions to reduce after layout
 */
export const prepareState = ({
  beforeLayoutActions = [],
  afterLayoutActions = [],
  ...props
}) => {
  const initialState = getInitialState(props);
  const actions = [
    ...beforeLayoutActions,
    (state) => {
      const graphState = getGraphInput(state);
      if (!graphState) {
        return state;
      }
      return updateGraph(graphNew(graphState));
    },
    ...afterLayoutActions,
  ];
  return actions.reduce(
    (state, action) => rootReducer(state, action(state)),
    initialState
  );
};

/**
 * Example state objects for use in tests of redux-enabled components
 */
export const mockState = {
  json: prepareState({ data: 'json' }),
  demo: prepareState({ data: demo }),
  spaceflights: prepareState({ data: spaceflights }),
  spaceflightsReordered: prepareState({ data: spaceflightsReordered }),
};

/**
 * Set up RTL rendering wrapper for connected components
 */
export const setup = {
  render: (component, options = {}) => {
    const store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
        }),
      preloadedState: {
        ...mockState.spaceflights,
        ...(options?.state || {}),
      },
    });

    return {
      ...render(
        <Provider store={store}>
          <MemoryRouter>{component}</MemoryRouter>
        </Provider>
      ),
      store,
    };
  },
};
