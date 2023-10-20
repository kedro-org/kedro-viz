const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
];
