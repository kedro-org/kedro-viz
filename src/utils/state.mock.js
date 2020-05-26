import React from 'react';
import { Provider } from 'react-redux';
import { mount, shallow } from 'enzyme';
import configureStore from '../store';
import getInitialState from '../store/initial-state';

/**
 * Example state objects for use in tests of redux-enabled components
 */
export const mockState = {
  layers: getInitialState({ data: 'layers' }),
  lorem: getInitialState({ data: 'lorem' }),
  animals: getInitialState({ data: 'animals' })
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
      getInitialState({ data: 'lorem', ...props }, props)
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
