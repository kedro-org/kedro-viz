const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        KedroViz: './src/utils/viz-entry.js', // Entry point for KedroViz
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.min.js',
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
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()]
    }
};
