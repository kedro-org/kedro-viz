// This file contains any web-workers used in the app, which are inlined by
// webpack + workerize-loader, so that they can be used in the exported library
// without needing any special configuration on the part of the consumer.
// Web workers don't work in Jest, so in a test environment we directly import
// them instead, and then mock up a faux-worker function

/* eslint-disable import/no-webpack-loader-syntax */

const isTest = typeof jest !== 'undefined';

const graphWorker = isTest
  ? require('./graph')
  : require('workerize-loader?inline!./graph');

/**
 * Emulate a web worker for testing purposes
 */
const createMockWorker = worker => () => {
  const mockWorker = {
    terminate: () => {}
  };
  Object.keys(worker).forEach(name => {
    mockWorker[name] = payload =>
      new Promise(resolve => resolve(worker[name](payload)));
  });
  return mockWorker;
};

export const graph = isTest ? createMockWorker(graphWorker) : graphWorker;
