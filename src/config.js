/**
 * Generate a configuration object for use across the application
 */
const config = () => ({
  dataPath: './api/nodes.json',
  dataSource: process.env.REACT_APP_DATA_SOURCE || 'json',
  localStorageName: 'KedroViz'
});

export default config;
