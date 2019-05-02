/**
 * Generate a configuration object for use across the application
 */
const config = () => ({
  dataPath: './logs/nodes.json',
  dataSource: process.env.REACT_APP_DATA_SOURCE || 'json'
});

export default config;
