/**
 * Set the URL that the upload button should deploy to,
 * based on an environent variable
 */
const getEndpoint = () => {
  const endpointName = process.env.REACT_APP_ENDPOINT || 'prod';
  const endpoints = {
    local: 'http://localhost:3000/public/kernelai',
    dev: 'https://dev.qbstudioai.com/api/public/kernelai',
    uat: 'https://uat.qbstudioai.com/api/public/kernelai',
    prod: 'https://studio.quantumblack.com/api/public/kernelai'
  };

  return {
    name: endpointName,
    url: endpoints[endpointName] || endpoints.prod
  };
};

/**
 * Generate a configuration object for use across the application
 */
const config = () => {
  const endpoint = getEndpoint();

  return {
    dataPath: './logs/nodes.json',
    dataSource: process.env.REACT_APP_DATA_SOURCE || 'json',
    syncEndpoint: endpoint.url,
    localStorageName: `KernelAIPipelineViz_${endpoint.name}`
  };
};

export default config;
