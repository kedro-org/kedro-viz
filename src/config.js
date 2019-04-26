let dataSource;
if (process.env.REACT_APP_DATA_SOURCE) {
  dataSource = process.env.REACT_APP_DATA_SOURCE;
} else if (window.location.host.match(/qb\.com/g)) {
  dataSource = 'random';
} else {
  dataSource = 'json';
}

const endpointName = process.env.REACT_APP_ENDPOINT || 'prod';
const endpoints = {
  local: 'http://localhost:3000/public/kernelai',
  dev: 'https://dev.qbstudioai.com/api/public/kernelai',
  uat: 'https://uat.qbstudioai.com/api/public/kernelai',
  prod: 'https://studio.quantumblack.com/api/public/kernelai'
};

const config = {
  dataPath: './logs/nodes.json',
  dataSource,
  syncEndpoint: endpoints[endpointName] || endpoints.prod,
  localStorageName: `KernelAIPipelineViz_${endpointName}`
};

export default config;
