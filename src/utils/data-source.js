import getRandomPipeline from './random-data';
import animals from './data/animals.mock.json';
import demo from './data/demo.mock.json';

/**
 * Determine the data source ID from the URL query string, or an environment
 * variable from the CLI, or from the URL host, else return undefined.
 * You can supply one of the following strings:
   - 'random': Use randomly-generated data
   - 'animals': Use data from the 'animals' test dataset ( this is the same dataset as used by the Core team for their tests )
   - 'demo': Use data from the 'demo' test dataset
   - 'json': Load data from a local json file (in /public/api/main)
 * @return {string} Data source identifier
 */
export const getSourceID = () => {
  const qs = document.location.search.match(/data=(\w+)/);
  const { REACT_APP_DATA_SOURCE } = process.env;
  const isDemo = document.location.host === 'quantumblacklabs.github.io';

  if (qs) {
    return encodeURIComponent(qs[1]);
  }
  if (REACT_APP_DATA_SOURCE) {
    return REACT_APP_DATA_SOURCE;
  }
  if (isDemo) {
    return 'demo';
  }
  return 'json';
};

/**
 * Either load synchronous pipeline data, or else indicate with a string
 * that json data should be loaded asynchronously later on.
 * @param {string} source Data source identifier
 * @return {object|string} Either raw data itself, or 'json'
 */
export const getDataValue = (source) => {
  switch (source) {
    case 'animals':
      // Use data from the 'animals' test dataset
      return animals;
    case 'demo':
      // Use data from the 'demo' test dataset
      return demo;
    case 'random':
      // Use procedurally-generated data
      return getRandomPipeline();
    case 'json':
      // Load data asynchronously later
      return source;
    default:
      throw new Error(
        `Unexpected data source value '${source}'. Your input should be one of the following values: 'animals', 'demo', 'json', or 'random'`
      );
  }
};

/**
 * Determine which data source to use, and return it
 * @return {object|string} Pipeline data, or 'json'
 */
const getPipelineData = () => getDataValue(getSourceID());

export default getPipelineData;
