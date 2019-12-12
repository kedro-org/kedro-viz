import React from 'react';
import { Provider } from 'react-redux';
import { mount, shallow } from 'enzyme';
import store from '../store';
import getInitialState from '../components/app/initial-state';
import formatData from './format-data';
import animals from './data/animals.mock';
import loremIpsum from './data/lorem-ipsum.mock';

/**
 * Example state objects for use in tests of redux-enabled components
 */
export const mockState = {
  lorem: getInitialState(formatData(loremIpsum)),
  animals: getInitialState(formatData(animals))
};

// Redux stores based on mock data
export const mockStore = {
  lorem: store(mockState.lorem),
  animals: store(mockState.animals)
};

/**
 * React-Redux Provider wrapper for testing connected components
 * @param {Object} children A React component
 * @param {Object} state Redux state object for creating the store
 */
export const MockProvider = ({ children, state = mockState.lorem }) => (
  <Provider store={store(state)}>{children}</Provider>
);

/**
 * Set up mounted/shallow Enzyme wrappers
 */
export const setup = {
  /**
   * Mount a React-Redux Provider wrapper for testing connected components
   * @param {Object} children React component(s)
   * @param {Object} state Redux state object for creating the store
   */
  mount: (children, state) =>
    mount(<MockProvider state={state}>{children}</MockProvider>),
  /**
   * Render a pure React component in a shallow wrapper
   * @param {Object} Component A React component
   * @param {Object} props React component props
   */
  shallow: (Component, props = {}) => shallow(<Component {...props} />)
};
