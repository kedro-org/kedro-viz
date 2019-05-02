import React from 'react';
import { Provider } from 'react-redux';
import { mount, shallow } from 'enzyme';
import store from '../store';
import { getInitialState } from '../components/app/load-data';
import formatSnapshots from './format-data';

/**
 * Example data for use in tests
 */
export const mockData = [
  {
    created_ts: '1551452832000',
    kernel_ai_schema_id: '310750827599783',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    json_schema: [
      {
        inputs: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        name: 'consectetur',
        outputs: ['Aliquam', 'eu', 'accumsan', 'mauris'],
        tags: ['Nulla', 'pulvinar', 'enim', 'consectetur', 'volutpat']
      }
    ]
  },
  {
    created_ts: '9999999999999',
    kernel_ai_schema_id: '123456789012345',
    message: 'List of animal names',
    json_schema: [
      {
        inputs: ['cat', 'dog', 'parameters', 'parameters_rabbit'],
        name: 'salmon',
        outputs: ['pig', 'horse', 'sheep'],
        tags: ['huge', 'small']
      },
      {
        inputs: ['cat', 'weasel', 'elephant', 'bear'],
        name: 'shark',
        outputs: ['sheep', 'pig', 'giraffe']
      },
      {
        inputs: ['pig'],
        name: 'trout',
        outputs: ['whale']
      }
    ]
  }
];

/**
 * Example state object for use in tests of redux-enabled components
 */
export const mockState = getInitialState(formatSnapshots(mockData), {
  allowHistoryDeletion: true,
  allowUploads: true,
  showHistory: true
});

// Redux store based on mock data
export const mockStore = store(mockState);

/**
 * React-Redux Provider wrapper for testing connected components
 * @param {Object} children A React component
 * @param {Object} state Redux state object for creating the store
 */
export const MockProvider = ({ children, state = mockState }) => (
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
