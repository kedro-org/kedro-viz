# Platform-agnostic sharing with Kedro-Viz 

Introduced in Kedro-Viz version 7.1.0, the `kedro viz build` command allows seamless publishing and sharing of Kedro-Viz on any static website hosting platform. Running this command from the CLI generates a `build` folder within your Kedro project, containing a static Kedro-Viz app package.

This page describes how to publish Kedro-Viz on a static website hosting platform using `kedro viz build`. It uses the spaceflights tutorial as an example.

## Setup your kedro project 

If you haven't installed Kedro {doc}`follow the documentation to get set up<kedro:get_started/install>`. 

```{important}
We recommend that you use the same version of Kedro that was most recently used to test this tutorial (0.19.1). To check the version installed, type `kedro -V` in your terminal window.
```

1. In your terminal window, navigate to the folder you want to store the project. Generate the spaceflights tutorial project with all the code in place by using the [Kedro starter for the spaceflights tutorial](https://github.com/kedro-org/kedro-starters/tree/main/spaceflights-pandas):


```bash
kedro new --starter=spaceflights-pandas
```

When prompted for a project name, you can enter anything, but we will assume `Spaceflights` throughout.

2. When your project is ready, navigate to the root directory of the project. Install the dependencies from the project root directory by typing the following in your terminal:

```bash
pip install -r requirements.txt
```

3. Kedro-Viz requires specific minimum versions of `fsspec`, and `kedro` to publish your project. Ensure you have these correct versions by updating the `requirements.txt` file of the Kedro project to add the following:

```text
fsspec>=2023.9.0
kedro>=0.18.2
```

4. Execute the following command from your project's root directory:

```bash
kedro viz build
```

This creates a `build` folder containing your Kedro-Viz app package in your project directory. 

## Static website hosting platforms such as GitHub Pages

Follow the steps [listed in the GitHub pages documentation](https://docs.github.com/en/pages/quickstart) to create a Git repository that supports GitHub Pages. On completion, push the contents of the previously created `build` folder to this new repository. Your site will be available at the following URL: `http://<username>.github.io`
