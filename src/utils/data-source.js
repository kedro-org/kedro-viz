import getRandomPipeline from './random-data';

// Avoid errors when running in a non-browser environment
const hasWindow = typeof window !== 'undefined';

/**
 * Validate against expected results
 * @param {string} source Input type key
 * @return {string} Data source type key
 */
const validateDataSource = source => {
  const expectedInput = [
    'lorem',
    'animals',
    'demo',
    'layers',
    'json',
    'random'
  ];
  if (expectedInput.includes(source)) {
    // If random, supply random data instead. We're doing this here to avoid
    // including this file unnecessarily in the exported npm package
    if (source === 'random') {
      return getRandomPipeline();
    }
    return source;
  }
  if (source) {
    throw new Error(
      `Unexpected data source value '${source}'. Your input should be one of the following values: ${expectedInput.join(
        ', '
      )}.`
    );
  }
  return 'json';
};

/**
 * Determine which data source to use
 * @return {string} Data source type key
 */
const getDataSource = () => {
  let source;
  const qs = hasWindow && window.location.search.match(/data=(\w+)/);
  const { REACT_APP_DATA_SOURCE } = process.env;
  const isDemo =
    hasWindow && window.location.host === 'quantumblacklabs.github.io';

  if (qs) {
    source = encodeURIComponent(qs[1]);
  } else if (REACT_APP_DATA_SOURCE) {
    source = REACT_APP_DATA_SOURCE;
  } else if (isDemo) {
    source = 'demo';
  }
  return validateDataSource(source);
};

export default getDataSource;
