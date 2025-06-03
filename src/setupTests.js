// Configure react-testing-library
import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';


// Configure enzyme
// See https://create-react-app.dev/docs/running-tests/#srcsetuptestsjs
import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import util from 'util';

// Require to run enzyme tests after upgrading to React 18
Object.defineProperty(global, 'TextEncoder', {
  value: util.TextEncoder,
});

// Require to create jest using Plotly.js library
window.URL.createObjectURL = jest.fn();

configure({ adapter: new Adapter() });

// Suppress unnecessary console warnings/errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};



