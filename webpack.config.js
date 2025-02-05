const path = require('path');

// Bundle and inline web-workers
module.exports = {
  mode: 'production', // Production mode
  entry: {
    "kedro-viz": './src/components/app/index', // Entry point for KedroViz
  },
  output: {
    path: path.resolve(__dirname, 'esm'),
    filename: '[name].production.mjs',
    library: {
      type: 'module',
    },
  },
  externalsType: 'module',
  externals: {
    'plotly.js-dist-min': 'https://cdn.plot.ly/plotly-2.26.0.min.js',
    'react': 'https://esm.sh/react@18.2.0',
    'react-dom': 'https://esm.sh/react-dom@18.2.0',
    'lodash': 'https://esm.sh/lodash@4.17.2',
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: [/node_modules/, /(?:\.test\.js|\.spec\.js)$/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
        sideEffects: false,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        sideEffects: true,
      },
    ],
  },
};
