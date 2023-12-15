const openBrowser = require('react-dev-utils/openBrowser');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './index.js',
  devtool: 'inline-source-map',
  devServer: {
    onAfterSetupMiddleware: () => {
      openBrowser && openBrowser('http://localhost:1337');
    },
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 1337,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new HtmlWebpackPlugin({
      title: 'Kedro-Viz import test',
    }),
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '.temp'),
    publicPath: '/',
  },
};
