const path = require('path');

// Bundle and inline web-workers
module.exports = {
  mode: 'production',
  entry: './lib/esm/utils/worker.js',
  output: {
    filename: 'worker.js',
    globalObject: 'this',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'lib/esm/utils')
  }
};
