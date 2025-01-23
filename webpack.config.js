const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        kedroViz: './src/utils/viz-entry.js', // Entry point for KedroViz
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js', // Generates app.bundle.js and kedroViz.bundle.js
    },
    module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/preset-react'],
              },
            },
          },
          {
            test: /\.scss$/,
            use: [
              'style-loader', // Injects styles into the DOM
              'css-loader',   // Translates CSS into CommonJS
              'sass-loader',  // Compiles SCSS to CSS
            ],
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env': JSON.stringify({'REACT_APP_DATA_SOURCE': 'prop'})
        }),
      ],
};
