import { json } from 'd3-fetch';
import config from '../config';

/**
 * Asynchronously load, parse and format data from json file using D3
 */
const loadJsonData = () => {
  const { dataPath } = config();
  const fullPath = `/public${dataPath.substr(1)}`;

  return json(dataPath).catch(() => {
    throw new Error(
      `Unable to load pipeline data from ${dataPath}. If you're running Kedro-Viz as a standalone (e.g. for JavaScript development), please check that you have placed a data file at ${fullPath}.`
    );
  });
};

export default loadJsonData;
