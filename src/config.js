// Use 'test' or 'prod' for data environment values:
let env = 'prod';
if (process.env.REACT_APP_ENV) {
  env = process.env.REACT_APP_ENV;
} else if (window.location.host.match(/qb\.com/g)) {
  env = 'test';
}

const config = {
  dataPath: '/logs/nodes.json',
  env,
  localStorageName: `KernelAIPipelineViz_${env}`
};

export default config;
