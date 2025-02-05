const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

// Bundle and inline web-workers
module.exports = {
    mode: 'production', // Production mode
    entry: {
        "kedro-viz": './src/utils/viz-entry.js', // Entry point for KedroViz
    },
    output: {
        path: path.resolve(__dirname, 'umd'),
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
};
