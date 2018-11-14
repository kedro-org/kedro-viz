// Use 'test' or 'prod' for data environment values:
let env = 'prod';
if (process.env.REACT_APP_ENV) {
  env = process.env.REACT_APP_ENV;
} else if (window.location.host.match(/qb\.com/g)) {
  env = 'test';
}

let syncEndpoint;
switch (env) {
  case 'test':
    syncEndpoint = 'http://localhost:3000/public/kernelai';
    break;
  case 'staging':
    syncEndpoint = 'https://dev.qbstudioai.com/api/public/kernelai';
    break;
  default:
    syncEndpoint = 'http://studio.quantumblack.com/api/public/kernelai';
}

const config = {
  dataPath: '/logs/nodes.json',
  syncEndpoint,
  env,
  localStorageName: `KernelAIPipelineViz_${env}`
};

export default config;
