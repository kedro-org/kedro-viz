import React from 'react';
import { Provider } from 'react-redux';
import { mount, shallow } from 'enzyme';
import configureStore from '../store';
import getInitialState from '../store/initial-state';
import animals from './data/animals.mock.json';
import demo from './data/demo.mock.json';
import reducer from '../reducers';
import { updateFontLoaded } from '../actions';
import { getGraphInput } from '../selectors/layout';
import { updateGraph } from '../actions/graph';
import { graphNew, graphDagre } from './graph';

/**
 * Prime the state object for the testing environment
 * by running the asynchronous actions synchronously
 * @param {Object} props
 */
export const prepareState = props => {
  const initialState = getInitialState(props);
  const actions = [
    // Set fontLoaded = true:
    () => updateFontLoaded(true),
    // Precalculate graph layout:
    state => {
      const layout = state.flags.newgraph ? graphNew : graphDagre;
      const graph = layout(getGraphInput(state));
      return updateGraph(graph);
    }
  ];
  return actions.reduce(
    (state, action) => reducer(state, action(state)),
    initialState
  );
};

/**
 * Example state objects for use in tests of redux-enabled components
 */
export const mockState = {
  json: prepareState({ data: 'json' }),
  demo: prepareState({ data: demo }),
  animals: prepareState({ data: animals })
};

/**
 * Set up mounted/shallow Enzyme wrappers
 */
export const setup = {
  /**
   * Mount a React-Redux Provider wrapper for testing connected components
   * @param {Object} children React component(s)
   * @param {Object} props Store initialisation props
   */
  mount: (children, props = {}) => {
    const initialState = Object.assign(
      {},
      prepareState({ data: animals, ...props }, props)
    );
    return mount(
      <Provider store={configureStore(initialState)}>{children}</Provider>
    );
  },
  /**
   * Render a pure React component in a shallow wrapper
   * @param {Object} Component A React component
   * @param {Object} props React component props
   */
  shallow: (Component, props = {}) => shallow(<Component {...props} />)
};
