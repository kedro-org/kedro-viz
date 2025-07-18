const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const rules = [
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
      MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: { importLoaders: 1 },
      },
      'postcss-loader',
      'sass-loader',
    ],
    sideEffects: true,
  },
];

module.exports = [
  // 1. Bundle the main Kedro-Viz lib
  {
    mode: 'production',
    entry: './lib/components/app/index.js',
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: 'index.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      rules,
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'styles/styles.min.css',
      }),
    ],
  },
];
