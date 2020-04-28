const hasWindow = typeof window !== 'undefined';

/**
 * Determine which data source to use
 * @return {string} Data source type key
 */
const getDataSource = () => {
  let source;
  const qs = hasWindow && window.location.search.match(/data=(\w+)/);
  const { REACT_APP_DATA_SOURCE } = process.env;

  if (qs) {
    source = encodeURIComponent(qs[1]);
  } else if (REACT_APP_DATA_SOURCE) {
    source = REACT_APP_DATA_SOURCE;
  } else if (
    hasWindow &&
    window.location.host === 'quantumblacklabs.github.io'
  ) {
    source = 'demo';
  }
  return validateDataSource(source);
};

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
 * Generate a configuration object for use across the application
 */
const config = () => ({
  dataPath: './api/nodes.json',
  dataSource: getDataSource(),
  localStorageName: 'KedroViz'
});

export default config;
