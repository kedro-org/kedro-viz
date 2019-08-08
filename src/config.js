/**
 * Determine which data source to use
 */
const getDataSource = () => {
  let source;
  const qs = window.location.search.match(/data=(\w+)/);
  const { REACT_APP_DATA_SOURCE } = process.env;
  if (qs) {
    source = encodeURIComponent(qs[1]);
  } else if (REACT_APP_DATA_SOURCE) {
    source = REACT_APP_DATA_SOURCE;
  } else if (window.location.host === 'quantumblacklabs.github.io') {
    source = 'mock';
  }
  // Validate against expected results
  const expectedInput = { mock: true, json: true, random: true };
  return expectedInput[source] ? source : 'json';
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
