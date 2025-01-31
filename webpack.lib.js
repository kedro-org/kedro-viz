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
    mode: 'production', // Production mode
    entry: {
      "kedro-viz": './src/utils/viz-entry.js', // Entry point for KedroViz
    },
    output: {
      path: path.resolve(__dirname, 'lib/umd'),
      filename: '[name].production.min.js',
      library: 'KedroVizBundle', // Name of the UMD library
      libraryTarget: 'umd', // UMD allows compatibility across environments
      globalObject: 'this', // Ensures compatibility for both browsers and Node.js
    },
    externals: {
      'plotly.js-dist-min': 'Plotly',
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
          use: [
            'style-loader', // Injects styles into the DOM
            'css-loader',   // Translates CSS into CommonJS
            'sass-loader',  // Compiles SCSS to CSS
          ],
          sideEffects: true,
        },
      ],
    },
    optimization: {
      usedExports: true, // Helps in tree shaking, eliminating unused code
      splitChunks: { // Group external dependencies as a separate chunk
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
      minimize: true, // Minify the output
      minimizer: [new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console logs
          },
          output: {
            comments: false, // Remove comments
          },
        },
      })],
    }
  },
  {
    mode: 'development',
    entry: {
      "kedro-viz": './src/utils/viz-entry.js',
    },
    output: {
      path: path.resolve(__dirname, 'lib/umd'),
      filename: '[name].development.min.js',
      library: 'KedroVizBundle',
      libraryTarget: 'umd',
      globalObject: 'this',
    },
    externals: {
      'plotly.js-dist-min': 'Plotly',
    },
    devtool: 'source-map', // To generate source maps for debugging
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
        },
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader',
          ],
        },
      ],
    },
    optimization: {
      usedExports: true, // Helps in tree shaking, eliminating unused code
      minimize: true, // Minify the output
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
            output: {
              comments: false,
            },
          },
        }),
      ],
    },
  }
];
