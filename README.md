# Kedro-Viz
`develop` | `master`  
----------|---------  
[![CircleCI](https://circleci.com/gh/quantumblacklabs/kedro/tree/develop.svg?style=shield)](https://circleci.com/gh/quantumblacklabs/kedro-viz/tree/develop) | [![CircleCI](https://circleci.com/gh/quantumblacklabs/kedro-viz/tree/master.svg?style=shield)](https://circleci.com/gh/quantumblacklabs/kedro-viz/tree/master)
[![Build status](https://ci.appveyor.com/api/projects/status/2u74p5g8fdc45wwh/branch/develop?svg=true)](https://ci.appveyor.com/project/QuantumBlack/kedro-viz/branch/develop) | [![Build status](https://ci.appveyor.com/api/projects/status/2u74p5g8fdc45wwh/branch/master?svg=true)](https://ci.appveyor.com/project/QuantumBlack/kedrov-viz/branch/master)

[![npm version](https://img.shields.io/npm/v/@quantumblack/kedro-viz.svg?color=cc3534)](https://badge.fury.io/js/%40quantumblack%2Fkedro-viz)
[![PyPI version](https://img.shields.io/pypi/v/kedro-viz.svg?color=yellow)](https://pypi.org/project/kedro-viz/)
[![License](https://img.shields.io/badge/license-Apache%202.0-3da639.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python Version](https://img.shields.io/badge/python-3.5%20%7C%203.6%20%7C%203.7-blue.svg)](https://pypi.org/project/kedro-viz/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Kedro-Viz shows you how your [Kedro](https://github.com/quantumblacklabs/kedro) data pipelines are structured.

With Kedro-Viz you can:

- See how your datasets and Python functions (nodes) are resolved in [Kedro](https://github.com/quantumblacklabs/kedro) so that you can understand how your data pipeline is built
- Get a clear picture when you have lots of datasets and nodes by using tags to visualise sub-pipelines
- Search for nodes and datasets

![Kedro-Viz Pipeline Visualisation](https://github.com/quantumblacklabs/kedro-viz/blob/master/.github/img/pipeline_visualisation.png?raw=true)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), for which more complete documentation is available on the [project website](https://facebook.github.io/create-react-app/).

## How do I install and use Kedro-Viz?

> For in-depth development and usage notes, see the [Contribution Guidelines](./CONTRIBUTING.md).

### As a Kedro Python plugin

Kedro-Viz is available as a Python plugin named `kedro-viz`.

The following conditions must be true in order to visualise your pipeline:

- Your project directory must be available to the Kedro-Viz plugin.
- You must be using a Kedro project structure with a complete Data Catalog, nodes and pipeline structure.

To install it:

```bash
pip install kedro-viz
```

This will install `kedro` as a dependency, and add `kedro viz` as an additional CLI command.

![Kedro CLI command](https://github.com/quantumblacklabs/kedro-viz/blob/master/.github/img/kedro_cli_example.png?raw=true)

To visualise your pipeline, go to your project root directory and install the project-specific dependencies by running:

```bash
kedro install
```

This will install the dependencies specified in `requirements.txt` in your Kedro environment (see [the Kedro documentation](https://kedro.readthedocs.io/en/latest/02_getting_started/01_prerequisites.html#python-virtual-environments) for how to set up your Python virtual environment).

Finally, run the following command from the project directory to visualise your pipeline:

```bash
kedro viz
```

This command will run kedro_viz.server on `http://127.0.0.1:4141/` which cannot be accessed from another machine.
If you are using a remote server machine or a docker container, run the following command instead.

```bash
kedro viz --host 0.0.0.0
```

You can change the port with ```--port``` option if needed.


### As a JavaScript React component

Kedro-Viz is also available as an npm package named [@quantumblack/kedro-viz](https://www.npmjs.com/package/@quantumblack/kedro-viz). To install it:

```bash
npm install @quantumblack/kedro-viz
```

Then include it in your React application:

```javascript
import KedroViz from '@quantumblack/kedro-viz';

const MyApp = () => <KedroViz data={json} />;
```

As a JavaScript React component, the project is designed to be used in two different ways:

1. **Standalone application**

   Run `npm run build` to generate a production build as a full-page app. The built app will be placed in the `/build` directory. Data for the chart should be placed in `/public/api/nodes.json` because this directory is marked `gitignore`.

2. **React component**

   Kedro-Viz can be used as a React component that can be imported into other applications. Publishing the package will run `npm run lib`, which compiles the source code in `/src`, and places it in the `/lib` directory.

## What licence do you use?

Kedro-Viz is licensed under the [Apache 2.0](https://github.com/quantumblacklabs/kedro-viz/blob/master/LICENSE.md) License.
