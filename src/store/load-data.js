import { json } from 'd3-fetch';
import { dataPath, fullDataPath } from '../config';

/**
 * Asynchronously load and parse data from json file using d3-fetch
 * @param {string} path JSON data file location. Defaults to dataPath from config.js
 * @return {function} A promise that will return when the file is loaded and parsed
 */
const loadJsonData = path =>
  json(path || dataPath).catch(() => {
    throw new Error(
      `Unable to load pipeline data from ${path ||
        dataPath}. If you're running Kedro-Viz as a standalone (e.g. for JavaScript development), please check that you have placed a data file at ${path ||
        fullDataPath}.`
    );
  });

export default loadJsonData;
