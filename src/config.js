// Use 'test' or 'prod' for data environment values:
let dataSource;
if (process.env.REACT_APP_DATA_SOURCE) {
  dataSource = process.env.REACT_APP_DATA_SOURCE;
} else if (window.location.host.match(/qb\.com/g)) {
  dataSource = 'random';
} else {
  dataSource = 'json';
}

let syncEndpoint;
switch (process.env.REACT_APP_ENDPOINT) {
  case 'test':
    syncEndpoint = 'http://localhost:3000/public/kernelai';
    break;
  case 'staging':
    syncEndpoint = 'https://dev.qbstudioai.com/api/public/kernelai';
    break;
  default:
    syncEndpoint = 'https://studio.quantumblack.com/api/public/kernelai';
}

const config = {
  dataPath: '/logs/nodes.json',
  dataSource,
  syncEndpoint,
  localStorageName: `KernelAIPipelineViz_${syncEndpoint}`
};

export default config;
