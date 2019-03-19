# Kernel Pipeline Viz

This project creates a data visualisation of a Kernel AI pipeline.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For more complete documentation about Create React App, visit the [Github Repository](https://github.com/facebook/create-react-app) and [project website](https://facebook.github.io/create-react-app/).

## Development

Run `npm start` to begin development on a local server. To use as an imported package, run `npm run watch-lib` which will auto-update the compiled lib directory when watched files are changed.

### Environment variables

The project uses a couple of environment variables to allow you to configure data sources and endpoints. You can set them when starting up the dev server, e.g. `ENDPOINT=local DATA=random npm start` will set the data upload endpoint to localhost:3000, and serve randomly-generated data for the pipeline. This is usually the most useful setting for local development.

To understand better how the environment variables work, check `/src/config.js` and the scripts in `package.json`.

**Snapshot upload endpoint options**

There are four different ENDPOINT environment variable options. By default, it will upload to production. The different options are as follows:

- `ENDPOINT=local npm start` --> Upload snapshots to **localhost:3000**
- `ENDPOINT=dev npm start` --> Upload snapshots to **dev.qbstudioai.com**
- `ENDPOINT=uat npm start` --> Upload snapshots to **uat.qbstudioai.com**
- `npm start` --> Upload snapshots to **studio.quantumblack.com**

**Data import options**

By default, the app (when run locally), will upload data from a local file, which must be added manually at `/public/logs/nodes.json`.
However the DATA environment variable can be set to 'random' for procedurally-generated data (refreshed on each page-load). When random data is enabled, certain other features like snapshot history are also enabled even in standalone app mode, to help with testing.

So to recap:

- `DATA=random npm start` --> randomly-generated data
- `npm start` --> Data loaded from `/public/logs/nodes.json`

## Production

This project is designed to be used in a couple of different ways:

1. **Standalone application**
  Run `npm run build` to generate a production build as a full-page app. The built app will be placed in the `/build` directory. Data for the chart should be placed in `/public/logs/nodes.json`. This directory is gitignored.

2. **React component**
  Run `npm run lib` to generate a React component that can be imported into other applications. The built component will be placed in the `/lib` directory. This can then be published to npm (The `lib` script is run automatically as a `prepublish` script).

  Note: Because the QuantumBlack NPM package is currently set to private, this repo temporarily hosts compiled code from the `build` branch, so that it can be retrieved from projects that do not have access to the NPM package.

## Testing

This app uses [Jest](https://jestjs.io/) as its JavaScript test runner. To run tests, run
```
npm run test
```
See the [Create-React-App docs](https://github.com/facebook/create-react-app) for further information on JS testing.

### Python web server tests

When used in production with KernelAI, the standalone viz is served via a Flask (Python3) web application. You can run Python tests as follows:

1. Create and activate a test python virtual environment:
    ```
    python3 -m venv /tmp/test_ve/ && source /tmp/test_ve/bin/activate
    ```
2. Execute the tests:
    ```
    make pytest
    ```
3. Deactivate the python virtual environment:
    ```
    deactivate
    ```
