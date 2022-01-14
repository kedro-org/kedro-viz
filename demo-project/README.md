# demo-project

This project is designed to be a realistic example of what Kedro looks like when used in anger.

## Setup

1. Run `pip install kedro==0.17.6`
2. Run `kedro install --build-reqs`
3. Run `kedro run`
4. Run `kedro viz`

## Visualised output

![Visualised output](.tours/images/full.png)

## Touring through the codebase

This example project has been built to demonstrate several key journeys. Each of these has an associated [VS Code Tour](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour) that takes you around the interface to learn how it has been structured and to demonstrate some of the advanced parts of Kedro in way that reflects real world usage.

|#|Task|Description|
|-|-|-|
|1|Building the ingestion pipeline 🏗|Takes you through a simple ingestion pipeline which types the data and utilises key features such as `parameters` and `namespaces`.|
|2|Engineering features 🧩|Simple feature engineering pipeline which utilises some advanced techniques for deriving new features.|
|3|Running the models 🧠|A modelling pipeline that creates two instances of train/evaluation pipelines parametrised each applying a different modelling technique.|
|4|Plotly plots in Kedro Viz 📈|A walk-through on how to render Plotly visualisations natively in [Kedro-Viz](https://kedro.readthedocs.io/en/stable/03_tutorial/06_visualise_pipeline.html).|
|5|Custom DataSets 💾|This is a short tutorial on how to define and utilise a [custom dataset](https://kedro.readthedocs.io/en/stable/07_extend_kedro/03_custom_datasets.html) by inheriting from Kedro's `AbstractDataSet` type.|
|6|Custom Hooks 🎣|[Hooks](https://kedro.readthedocs.io/en/latest/07_extend_kedro/02_hooks.html) allow you to add custom functionality to the `kedro run` lifecycle. This tutorial takes you through an example hook which records the time taken to read data from disk and logs out the durations.|
|7|Additional Configuration Environments ⚙️|One of the most powerful features in Kedro is the way that one can introduce [hierarchical configurations](https://kedro.readthedocs.io/en/latest/04_kedro_project_setup/02_configuration.html#additional-configuration-environments). This follows the philosophy set out in the [12FactorApp](https://12factor.net/config).|

### How to use the VS Code Tour Extension

![extension](.tours/images/vs_code_tour.png)

|Method|Description|
|-|-|
|Install [VS Code](https://code.visualstudio.com/download) + [Extension](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour)|For best results install the application and extension locally.|
|Use the [gitHub.dev](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor) web based editor|For quickest results simply press `.` in the GitHub repository and install the [Code Tour extension](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour) from the marketplace using the web-based editor. At the time of writing embedded images don't work, but everything else does.|
