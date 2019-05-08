# Kedro-Viz

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python Version](https://img.shields.io/pypi/pyversions/kedro-viz.svg)](https://pypi.org/project/kedro-viz/)
[![PyPI version](https://badge.fury.io/py/kedro-viz.svg)](https://pypi.org/project/kedro-viz/)
[![npm version](https://badge.fury.io/js/%40quantumblacklabs%2Fkedro-viz.svg)](https://badge.fury.io/js/%40quantumblacklabs%2Fkedro-viz)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Kedro-Viz changes how you look at your workflow, by showing you how your [Kedro](https://github.com/quantumblacklabs/kedro) data pipelines are structured.

With Kedro-Viz you can:

- See how your datasets and Python functions (nodes) are resolved in [Kedro](https://github.com/quantumblacklabs/kedro) so that you can understand how your data pipeline is built
- Get a clear picture when you have lots of datasets and nodes by using tags to visualise sub-pipelines
- Search for nodes and datasets

This project was bootstrapped with Create React App, for which, more complete documentation is available on [Github](https://github.com/facebook/create-react-app) and the [project website](https://facebook.github.io/create-react-app/).

![Kedro-Viz Pipeline Visualisation](https://github.com/quantumblacklabs/kedro-viz/blob/master/img/pipeline_visualisation.png)

## How do I install and use Kedro-Viz?

### Kedro Python plugin

Kedro-Viz is available as a Python plugin named `kedro_viz`. To install it:

```bash
pip install kedro-viz
```

The plugin adds a `kedro viz` CLI command. Run this command to visualise your pipeline.

### JavaScript React Component

Kedro-Viz is also available as an npm package named [@quantumblack/kedro-viz](https://www.npmjs.com/package/@quantumblack/kedro-viz). To install it:

```bash
npm install @quantumblack/kedro-viz
```

Then include it in your React application:

```javascript
import KedroViz from '@quantumblack/kedro-viz';

const MyApp = () => <KedroViz data={json} />;
```

### Prerequisites

The following conditions must be true in order to visualise your pipeline:

- Your project directory must be available to the Kedro-Viz plugin.
- You must be using a Kedro project structure with a completed Data Catalog, nodes and pipeline structure.

## Development

First, clone this repo and install dependencies (`npm i`). To begin development on a local server, use

```bash
npm start
```

This will serve the app at [localhost:4141](http://localhost:4141/), and watch the `/src` folders. It will also update the `/lib` directory, which contains a Babel-compiled copy of the source. This directory is exported to npm, and is used when importing as a React component into another application. It is updated automatically on save, in case you need to test/debug this locally (e.g. with `npm link`). You can also update it manually:

```bash
npm run lib
```

### Environment variables

The project uses environment variables to allow you to configure data sources and endpoints. You can set them when starting up the dev server, e.g. `ENDPOINT=local DATA=random npm start` will set the data upload endpoint to localhost:3000, and serve randomly-generated data for the pipeline. This is usually the most useful setting for local development.

To understand better how the environment variables work, check `/src/config.js` and the scripts in `package.json`.

**Snapshot upload endpoint options**

There are four different ENDPOINT environment variable options. By default, it will upload to production. The different options are as follows:

- `ENDPOINT=local npm start` --> Upload snapshots to **localhost:3000**
- `ENDPOINT=dev npm start` --> Upload snapshots to **dev.qbstudioai.com**
- `ENDPOINT=uat npm start` --> Upload snapshots to **uat.qbstudioai.com**
- `npm start` --> Upload snapshots to **studio.quantumblack.com**

**Data import options**

By default, the app (when run locally), will upload data from a local file, which must be added manually at `/public/logs/nodes.json`.
However the DATA environment variable can be set to `random` for procedurally-generated data (refreshed on each page-load). When random data is enabled, certain other features like snapshot history are also enabled even in standalone app mode, to help with testing.

So to recap:

- `DATA=random npm start` --> randomly-generated data
- `npm start` --> Data loaded from `/public/logs/nodes.json`

## Production

This project is designed to be used in a couple of different ways:

1. **Standalone application**
   Run `npm run build` to generate a production build as a full-page app. The built app will be placed in the `/build` directory. Data for the chart should be placed in `/public/logs/nodes.json` because this directory is marked `gitignore`.

2. **React component**
   Run `npm run lib` to generate a React component that can be imported into other applications. The built component will be placed in the `/lib` directory. This can then be published to npm (The `lib` script is run automatically as a `prepublish` script).

Note: Because the QuantumBlack npm package is currently set to private, this repo temporarily hosts compiled code from the `build` branch, so that it can be retrieved from projects that do not have access to the npm package.

## Testing

### JavaScript application tests

This app uses [Jest](https://jestjs.io/) and [Enzyme](https://airbnb.io/enzyme/) to run JavaScript tests, which you can invoke as follows:

```bash
npm test
```

You can also [inspect and debug tests](https://facebook.github.io/create-react-app/docs/debugging-tests):

```bash
npm run test:debug
```

And [check test coverage](https://facebook.github.io/create-react-app/docs/running-tests#coverage-reporting):

```bash
npm run test:coverage
```

See the [Create-React-App docs](https://github.com/facebook/create-react-app) for further information on JS testing.

### Python web server tests

When used in production with Kedro, the standalone viz is served via a Flask (Python3) web application. You can run Python tests as follows:

1. Create and activate a test python virtual environment:

   ```bash
   python3 -m venv /tmp/test_ve/ && source /tmp/test_ve/bin/activate
   ```

2. Execute the tests:

   ```bash
   make pytest
   ```

3. Deactivate the python virtual environment:

   ```bash
   deactivate
   ```

## What licence do you use?

Kedro-Viz is licensed under the [Apache 2.0](https://github.com/quantumblacklabs/kedro-viz/blob/master/LICENSE.md) License.
