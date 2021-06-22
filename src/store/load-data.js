import { json } from 'd3-fetch';
import { getUrl } from '../utils';
import node_task from '../utils/data/node_task.mock.json';
import node_plot from '../utils/data/node_plot.mock.json';
import node_parameters from '../utils/data/node_parameters.mock.json';
/**
 * Asynchronously load and parse data from json file using d3-fetch.
 * Throws an error if the request for `main` fails.
 * For requests other than `main`, returns the given or default fallback response.
 * @param {string} path JSON file location. Defaults to main data url from config.js
 * @param {object} fallback The fallback response object on request failure. Default `{}`.
 * @return {function} A promise that will return when the file is loaded and parsed
 */
export const loadJsonData = (path = getUrl('main'), fallback = {}) =>
  json(path).catch(() => {
    const fullPath = `/public${path.substr(1)}`;

    // For main route throw a user error
    if (path === getUrl('main')) {
      throw new Error(
        `Unable to load data from ${path}. If you're running Kedro-Viz as a standalone (e.g. for JavaScript development), please check that you have placed a data file at ${fullPath}.`
      );
    }

    return new Promise((resolve) => resolve(fallback));
  });

// Adds metadata information in utils/data to animals mock dataset
export const loadMockNodeData = (dataSource, nodeId) => {
  if (dataSource === 'animals') {
    if (nodeId === 'f1f1425b') {
      return node_parameters;
    }
    if (nodeId === 'c3p345ed') {
      return node_plot;
    }
    if (nodeId === '443cf06a') {
      return node_task;
    }
  }
};

export default loadJsonData;
