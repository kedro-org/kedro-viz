# Kedro-Viz

<br />
<p align="center">

![Kedro-Viz Pipeline Visualisation](https://raw.githubusercontent.com/kedro-org/kedro-viz/main/.github/img/banner.png)

</p>

<p align="center">
✨ <em> Data Science Pipelines. Beautifully Designed</em> ✨
<br />
Live Demo: <a href="https://demo.kedro.org/" target="_blank">https://demo.kedro.org/</a>
</p>

<br />

[![CircleCI](https://circleci.com/gh/kedro-org/kedro-viz/tree/main.svg?style=shield)](https://circleci.com/gh/kedro-org/kedro-viz/tree/main)
[![Documentation](https://readthedocs.org/projects/kedro/badge/?version=stable)](https://docs.kedro.org/en/stable/visualisation/)
[![Python Version](https://img.shields.io/badge/python-3.8%20%7C%203.9%20%7C%203.10%20%7C%203.11-orange.svg)](https://pypi.org/project/kedro-viz/)
[![PyPI version](https://img.shields.io/pypi/v/kedro-viz.svg?color=yellow)](https://pypi.org/project/kedro-viz/)
[![Downloads](https://static.pepy.tech/badge/kedro-viz/week)](https://pepy.tech/project/kedro-viz)
[![npm version](https://img.shields.io/npm/v/@quantumblack/kedro-viz.svg?color=cc3534)](https://badge.fury.io/js/%40quantumblack%2Fkedro-viz)
[![License](https://img.shields.io/badge/license-Apache%202.0-3da639.svg)](https://opensource.org/licenses/Apache-2.0)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Slack Organisation](https://img.shields.io/badge/slack-chat-blueviolet.svg?label=Kedro%20Slack&logo=slack)](https://slack.kedro.org)

## Introduction

Kedro-Viz is an interactive development tool for building data science pipelines with [Kedro](https://github.com/kedro-org/kedro). Kedro-Viz also allows users to view and compare different runs in the Kedro project.

## Features

- ✨ Complete visualisation of a Kedro project and its pipelines
- 🎨 Supports light & dark themes out of the box
- 🚀 Scales to big pipelines with hundreds of nodes
- 🔎 Highly interactive, filterable and searchable
- 🔬 Focus mode for modular pipeline visualisation
- 📊 Rich metadata side panel to display parameters, plots, etc.
- 📊 Supports all types of [Plotly charts](https://plotly.com/javascript/)
- ♻️ Autoreload on code change
- 🧪 Supports tracking and comparing runs in a Kedro project
- 🎩 Many more to come

## Installation

There are two ways you can use Kedro-Viz:

- As a [Kedro plugin](https://docs.kedro.org/en/stable/extend_kedro/plugins.html) (the most common way).

  To install Kedro-Viz as a Kedro plugin:

  ```bash
  pip install kedro-viz
  ```

- As a standalone React component (for embedding Kedro-Viz in your web application).

  To install the standalone React component:

  ```bash
  npm install @quantumblack/kedro-viz
  ```

## Usage

#### Compatibility with Kedro

Ensure your Kedro-Viz and Kedro versions are compatible by referencing the following table:

| Kedro-Viz version | Kedro version     |
| ----------------- | ----------------- |
| >=4.7             | >=0.17.5          |
| >=3.8.0, <4.7     | >=0.16.6, <0.17.5 |
| <3.8.0            | <0.16.6           |

For **Python 3.6** users, the last supported version of Kedro-Viz is **3.16.0**

### CLI Usage

To launch Kedro-Viz from the command line as a Kedro plugin, use the following command from the root folder of your Kedro project:

```bash
kedro viz run
```

A browser tab opens automatically to serve the visualisation at `http://127.0.0.1:4141/`.

Kedro-Viz also supports the following additional arguments on the command line:

```bash
Usage: kedro viz run [OPTIONS]

  Visualise a Kedro pipeline using Kedro-Viz.

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

  --ignore-plugins          A flag to ignore all installed plugins in the Kedro Project
  
  --params TEXT             Specify extra parameters that you want to pass to
                            the context initializer. Items must be separated
                            by comma, keys - by colon, example:
                            param1:value1,param2:value2. Each parameter is
                            split by the first comma, so parameter values are
                            allowed to contain colons, parameter keys are not.
                            To pass a nested dictionary as parameter, separate
                            keys by '.', example: param_group.param1:value1.

  -h, --help                Show this message and exit.
```

### Experiment Tracking usage

To enable [experiment tracking](https://docs.kedro.org/en/stable/experiment_tracking/index.html) in Kedro-Viz, you need to add the Kedro-Viz `SQLiteStore` to your Kedro project.

This can be done by adding the below code to `settings.py` in the `src` folder of your Kedro project.

```python
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore
from pathlib import Path
SESSION_STORE_CLASS = SQLiteStore
SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data")}
```

Once the above set-up is complete, tracking datasets can be used to track relevant data for Kedro runs. More information on how to use tracking datasets can be found in the [experiment tracking documentation](https://docs.kedro.org/en/stable/experiment_tracking/index.html)

**Notes:**

- Experiment Tracking is only available for Kedro-Viz >= 4.0.2 and Kedro >= 0.17.5
- Prior to Kedro 0.17.6, when using tracking datasets, you will have to explicitly mark the datasets as `versioned` for it to show up properly in Kedro-Viz experiment tracking tab. From Kedro >= 0.17.6, this is done automatically:

```yaml
train_evaluation.r2_score_linear_regression:
  type: tracking.MetricsDataset
  filepath: ${base_location}/09_tracking/linear_score.json
  versioned: true
```

### Standalone React component usage

To use Kedro-Viz as a standalone React component, you can follow the example below. However, please note that Kedro-Viz does not support server-side rendering (SSR). If you're using Next.js or another SSR framework, you should be aware of this limitation.

```javascript
import KedroViz from '@quantumblack/kedro-viz';
import '@quantumblack/kedro-viz/lib/styles/styles.min.css';

const MyApp = () => <KedroViz data={json} />;
```

To use with NextJS:

```javascript
import '@quantumblack/kedro-viz/lib/styles/styles.min.css';
import dynamic from 'next/dynamic';

const NoSSRKedro = dynamic(() => import('@quantumblack/kedro-viz'), {
  ssr: false,
});

const MyApp = () => <NoSSRKedro data={json} />;
```

The JSON can be obtained by running:

```bash
kedro viz run --save-file=filename.json
```

We also recommend wrapping the `Kedro-Viz` component with a parent HTML/JSX element that has a specified height (as seen in the above example) in order for Kedro-Viz to be styled properly.

**_Our documentation contains [additional examples on how to visualise with Kedro-Viz.](https://docs.kedro.org/en/stable/visualisation/index.html)_**

## Feature Flags

Kedro-Viz uses features flags to roll out some experimental features. The following flags are currently in use:

| Flag               | Description                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| sizewarning        | From release v3.9.1. Show a warning before rendering very large graphs (default `true`) |
| expandAllPipelines | From release v4.3.2. Expand all modular pipelines on first load (default `false`)       |

To enable or disable a flag, click on the settings icon in the toolbar and toggle the flag on/off.

Kedro-Viz also logs a message in your browser's [developer console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console) to show the available flags and their values as currently set on your machine.

## Maintainers

Kedro-Viz is maintained by the [Kedro team](https://docs.kedro.org/en/stable/contribution/technical_steering_committee.html#kedro-maintainers) and a number of [contributors from across the world](https://github.com/kedro-org/Kedro-Viz/contributors).

## Contribution

If you want to contribute to Kedro-Viz, please check out our [contributing guide](./CONTRIBUTING.md).

## License

Kedro-Viz is licensed under the [Apache 2.0](https://github.com/kedro-org/kedro-viz/blob/main/LICENSE.md) License.

## Citation

If you're an academic, Kedro-Viz can also help you, for example, as a tool to visualise how your publication's pipeline is structured. Find our citation reference on [Zenodo](https://doi.org/10.5281/zenodo.4277218).
