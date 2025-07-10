const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        'kedro-viz': './src/utils/viz-entry.js',
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
    },
    experiments: {
        outputModule: true,
    },
    resolve: {
        extensions: ['.js', '.jsx'], 
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
    optimization: {
        minimize: true,
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
};
