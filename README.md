# Kedro-Viz

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python Version](https://img.shields.io/pypi/pyversions/kedro-viz.svg)](https://pypi.org/project/kedro-viz/)
[![PyPI version](https://badge.fury.io/py/kedro-viz.svg)](https://pypi.org/project/kedro-viz/)
[![npm version](https://badge.fury.io/js/kedro-viz.svg)](https://badge.fury.io/js/kedro-viz)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-black.svg)](https://github.com/ambv/black)

Kedro-Viz changes how you look at your workflow by showing you how your [Kedro](https://github.com/quantumblacklabs/kedro) data pipelines are structured.

With Kedro-Viz you can:

- See how your datasets and Python functions (nodes) are resolved in [Kedro](https://github.com/quantumblacklabs/kedro) so that you can understand how your data pipeline is built
- Get a clear picture when you have lots of datasets and nodes by using tags to visualise sub-pipelines
- Search for nodes and datasets

This project was bootstrapped with Create React App, for which, more complete documentation is available on [Github](https://github.com/facebook/create-react-app) and the [project website](https://facebook.github.io/create-react-app/).

![Kedro-Viz Pipeline Visualisation](https://github.com/quantumblacklabs/kedro-viz/blob/master/img/pipeline_visualisation.png)

## How do I install Kedro-Viz?

Kedro-Viz is available as a Python plugin named `kedro_viz`. To install it:

```bash
pip install kedro_viz
```

## How do I use Kedro-Viz?

The Kedro-Viz plugin adds a `kedro-viz` CLI command. Run this command to visualise your pipeline.  

### Prerequisites

The following conditions must be true in order to visualise your pipeline:

* Your project directory must be available to the Kedro-Viz plugin.
* You must be using a Kedro project structure with a completed Data Catalog, nodes and pipeline structure.

## Development

Run `npm start` to begin development on a local server. To use as an imported package, run `npm run watch-lib` which will auto-update the compiled lib directory when watched files are changed.

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

  Note: Because the QuantumBlack NPM package is currently set to private, this repo temporarily hosts compiled code from the `build` branch, so that it can be retrieved from projects that do not have access to the NPM package.

## Testing

This app uses [Jest](https://jestjs.io/) as its JavaScript test runner, which you can invoke as follows:

```bash
npm run test
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
