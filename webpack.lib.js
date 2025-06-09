const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [
  // Web worker bundle
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
  // Styles + container.js(x)
  {
    mode: 'production',
    entry: './lib/components/container/container.jsx', // 🔁 updated from .js
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
          test: /\.(js|jsx)$/, // ✅ include jsx
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
            MiniCssExtractPlugin.loader,
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
    resolve: {
      extensions: ['.js', '.jsx'], // ✅ so you don’t have to specify .jsx in import
    },
  },
];
