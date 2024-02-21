# Platform-agnostic sharing with Kedro-Viz 

In Kedro-Viz version 7.1.0, we introduced the `kedro viz build` command that enables you to publish and share Kedro-Viz to any static website hosting platform. Running this command from the command line interface (CLI) creates a `build` folder within the Kedro project. The build folder contains a static Kedro-Viz app package, which can be used as a source to publish on any static website hosting platform.

## Static website hosting platforms such as GitHub Pages

Follow the steps [listed in the GitHub pages documentation](https://docs.github.com/en/pages/quickstart) to create a Git repository that supports GitHub Pages. On completion, push the contents of the `build` folder to this new repository. Your site will be available at the following URL: `http://<username>.github.io`