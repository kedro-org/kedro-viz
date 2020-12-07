import { json } from 'd3-fetch';
import { getUrl } from '../utils';

/**
 * Asynchronously load and parse data from json file using d3-fetch
 * @param {string} path JSON file location. Defaults to main data url from config.js
 * @return {function} A promise that will return when the file is loaded and parsed
 */
const loadJsonData = (path = getUrl('main')) =>
  json(path).catch(() => {
    const fullPath = `/public${path.substr(1)}`;
    throw new Error(
      `Unable to load data from ${path}. If you're running Kedro-Viz as a standalone (e.g. for JavaScript development), please check that you have placed a data file at ${fullPath}.`
    );
  });

export default loadJsonData;
