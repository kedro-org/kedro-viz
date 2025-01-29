const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// Bundle and inline web-workers
module.exports = [
  {
    mode: 'production',
    entry: './lib/utils/worker.js',
    output: {
      filename: 'worker.js',
      globalObject: 'this',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'lib/utils'),
    },
  },
  {
    mode: 'production',
    entry: './lib/components/container/container.js',
    output: {
      path: path.resolve(__dirname, 'lib/styles'),
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'styles.min.css',
      }),
    ],
    module: {
      rules: [
        {
          test: /\.(js)$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.scss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: require.resolve('css-loader'),
              options: { importLoaders: 3 },
            },
            {
              loader: require.resolve('postcss-loader'),
            },
            {
              loader: require.resolve('sass-loader'),
            },
          ],
          sideEffects: true,
        },
      ],
    },
  },
  {
    mode: 'production',
    entry: {
        KedroViz: './src/utils/viz-entry.js', // Entry point for KedroViz
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.min.js',
        library: 'KedroVizBundle', // Name of the UMD library
        libraryTarget: 'umd', // UMD allows compatibility across environments
        globalObject: 'this', // Ensures compatibility for both browsers and Node.js
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
}
];
