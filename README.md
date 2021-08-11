# Kedro-Viz

<br />
<p align="center">

![Kedro-Viz Pipeline Visualisation](./.github/img/kedro-viz-banner.png)

</p>

<p align="center">
✨ <em> Data Science Pipelines, Beautifully Designed</em> ✨
</p>

<br />

[![CircleCI](https://circleci.com/gh/quantumblacklabs/kedro-viz/tree/main.svg?style=shield)](https://circleci.com/gh/quantumblacklabs/kedro-viz/tree/main)
[![npm version](https://img.shields.io/npm/v/@quantumblack/kedro-viz.svg?color=cc3534)](https://badge.fury.io/js/%40quantumblack%2Fkedro-viz)
[![Python Version](https://img.shields.io/badge/python-3.6%20%7C%203.7%20%7C%203.8-orange.svg)](https://pypi.org/project/kedro-viz/)
[![PyPI version](https://img.shields.io/pypi/v/kedro-viz.svg?color=yellow)](https://pypi.org/project/kedro-viz/)
[![License](https://img.shields.io/badge/license-Apache%202.0-3da639.svg)](https://opensource.org/licenses/Apache-2.0)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4355948.svg)](https://doi.org/10.5281/zenodo.4355948)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Introduction

Kedro-Viz is an interactive development tool for buidling data science pipelines with [Kedro](https://github.com/quantumblacklabs/kedro).

## Features

- ✨ Complete visualisation of a Kedro project and its pipelines
- 🎨 Support light & dark themes out of the box
- 🚀 Scale to big pipelins with hundreds of nodes
- 🔎 Highly interactive, filterable and searchable
- 🔬 Focus mode for modular pipelines visualisation
- 📊 Rich metadata side panel to display parameters, plots, etc.
- ♻️ Autoreload on code change
- 🎩 And many more to come

## Installation

There are two ways you can use Kedro-Viz:

* As a [Kedro plugin](https://kedro.readthedocs.io/en/stable/07_extend_kedro/04_plugins.html) (the most common way).
* As a standalone React component (for embedding Kedro-Viz in your web application).

To install Kedro-Viz as a Kedro plugin:

```bash
$ pip install kedro-viz
```

To install the standalone React component:

```bash
$ npm install @quantumblack/kedro-viz
```

## Usage


### As a Kedro plugin

You can launch Kedro-Viz as a Kedro plugin from the command line with the following command at the root of a Kedro project:

```bash
$ kedro viz
```

A browser tab should automatically open and serve the visualisation at `http://127.0.0.1:4141/`.

Kedro-Viz also supports the following additional arguments on the command line:

```bash
Usage: kedro viz [OPTIONS]

  Visualise a Kedro pipeline using Kedro viz.

Options:
  --host TEXT               Host that viz will listen to. Defaults to
                            localhost.

  --port INTEGER            TCP port that viz will listen to. Defaults to
                            4141.

  --browser / --no-browser  Whether to open viz interface in the default
                            browser or not. Browser will only be opened if
                            host is localhost. Defaults to True.

  --load-file FILE          Path to load the pipeline JSON file
  --save-file FILE          Path to save the pipeline JSON file
  --pipeline TEXT           Name of the registered pipeline to visualise. If not
                            set, the default pipeline is visualised

  -e, --env TEXT            Kedro configuration environment. If not specified,
                            catalog config in `local` will be used

  --autoreload              Autoreload viz server when a Python or YAML file change in
                            the Kedro project

  -h, --help                Show this message and exit.
```

### As a standalone React component

To use Kedro-Viz as a standalone React component, import the component and supply a data JSON as prop:

```javascript
import KedroViz from '@quantumblack/kedro-viz';

const MyApp = () => <KedroViz data={json} />;
```

The JSON can be obtained by running:

```bash
$ kedro viz --save-file=filename.json
```

## Feature Flags

Kedro-Viz uses features flags to roll out some experimental features. The following flags are currently in use:

| Flag | Description |
|------| ------------|
| sizewarning | From release v3.9.1. Show a warning before rendering very large graphs. (default `true`) |

To enable or disable a flag, you can click on the settings icon in the toolbar and toggle the flag on/off.

Kedro-Viz will also log a message in your browser's [developer console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console) regarding the available flags and their values as currently set on your machine.

## Maintainers

Kedro-Viz is maintained by a [product team from QuantumBlack](https://kedro.readthedocs.io/en/stable/12_faq/01_faq.html) and a number of [contributors from across the world](https://github.com/quantumblacklabs/Kedro-Viz/contributors).
## Contribution

If you want to contribute to Kedro-Viz, please check out our [contributing guide](./CONTRIBUTING.md).

## License

Kedro-Viz is licensed under the [Apache 2.0](https://github.com/quantumblacklabs/kedro-viz/blob/main/LICENSE.md) License.

## Citation

If you're an academic, Kedro-Viz can also help you, for example, as a tool to visualise how your publication's pipeline is structured. Find our citation reference on [Zenodo](https://doi.org/10.5281/zenodo.4277218).
