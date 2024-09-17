# Kedro Viz CLI reference

The Kedro Viz CLI provides commands to visualise Kedro pipelines, deploy them to cloud platforms, and export the visualisation data. Below is a detailed description of the available commands and options.

## Commands

### `kedro viz`

Launches a local Kedro Viz instance to visualise a Kedro pipeline.

**Usage:**

```bash
kedro viz [OPTIONS]
```

**Description:**

This command launches the Kedro Viz server to visualise a Kedro pipeline. It is functionally the same as `kedro viz run`. If no sub-command is provided, `run` is used by default.

**Options:**

This command accepts all the options that are available in the `kedro viz`, `kedro viz run` command. See the `kedro viz run` section for a complete list of options.

### `kedro viz run`

Launches a local Kedro Viz instance to visualise a Kedro pipeline.

**Usage:**

```bash
kedro viz run [OPTIONS]
```

**Options:**

- `--host <host>`
  - Host that Kedro Viz will listen to. Defaults to `localhost`.
  
- `--port <port>`
  - TCP port that Kedro Viz will listen to. Defaults to `4141`.

- `--browser / --no-browser`
  - Whether to open the Kedro Viz interface in the default browser. The browser will open if the host is `localhost`. Defaults to `True`.

- `--load-file <path>`
  - Path to load Kedro Viz data from a directory. If provided, Kedro Viz will load the visualisation data from this path instead of generating it from the pipeline.

- `--save-file <path>`
  - Path to save Kedro Viz data to a directory. If provided, the visualisation data will be saved to this path for later use.

- `--pipeline, -p <pipeline>`
  - Name of the registered pipeline to visualise. If not set, the default pipeline is visualised.

- `--env, -e {environment>}`
  - Kedro configuration environment. If not specified, the catalog config in `local` will be used. You can also set this through the `KEDRO_ENV` environment variable.

- `--autoreload, -a`
  - Enable autoreload of the Kedro Viz server when a Python or YAML file changes in the Kedro project.

- `--include-hooks`
  - Include all registered hooks in the Kedro project for visualisation.

- `--params <params>`
  - Specify extra parameters for the Kedro Viz run. This option supports the same format as the `params` option in the Kedro CLI.

- `--lite`                    
  - An experimental flag to open Kedro-Viz without Kedro project dependencies.


```{note}
When running Kedro Viz locally with the `--autoreload` option, the server will automatically restart whenever there are changes to Python, YAML, or JSON files in the Kedro project. This is particularly useful during development.
```


### `kedro viz deploy`

Deploy and host Kedro Viz on a specified cloud platform.

```{note}
The `deploy` command supports deployment to AWS, Azure and GCP. Ensure that your cloud credentials and configurations are correctly set up before deploying.
```

**Usage:**

```bash
kedro viz deploy [OPTIONS]
```

**Options:**

- `--platform <platform>`
  - The cloud platform to host Kedro Viz on. Supported platforms include `aws` `azure` and `gcp`. This option is required.

- `--endpoint <endpoint>`
  - The static website hosted endpoint. This option is required.

- `--bucket-name <bucket-name>`
  - The name of the bucket where Kedro Viz will be hosted. This option is required.

- `--include-hooks`
  - Include all registered hooks in the Kedro project in the deployed visualisation.

- `--include-previews`
  - Include previews for all datasets in the deployed visualisation.

### `kedro viz build`

Create a build directory of a local Kedro Viz instance with Kedro project data.

**Usage:**

```bash
kedro viz build [OPTIONS]
```

**Options:**

- `--include-hooks`
  - Include all registered hooks in the Kedro project in the built visualisation.

- `--include-previews`
  - Include previews for all datasets in the built visualisation.


## Examples

### Running Kedro Viz locally

To run Kedro Viz on your local machine, use:

```bash
kedro viz
```

To specify a particular pipeline and environment:

```bash
kedro viz  -p my_pipeline -e dev
```

or 

```bash
kedro viz run -p my_pipeline -e dev
```

### Deploying Kedro Viz to AWS

To deploy Kedro Viz to an S3 bucket on AWS:

```bash
kedro viz deploy --platform aws --endpoint http://mybucket.s3-website-us-west-2.amazonaws.com --bucket-name mybucket
```

### Building Kedro Viz to host on multiple platforms 

To create a build directory with the visualisation data:

```bash
kedro viz build --include-previews
```



