# Publish and share Kedro-Viz

```{note}
Kedro-Viz sharing was introduced in version 6.6.0.
```

This page describes how to publish Kedro-Viz to a static website hosting platform to share it with others. It uses the {doc}`spaceflights tutorial<kedro:tutorial/spaceflights_tutorial>` as an example.

If you haven't installed Kedro {doc}`follow the documentation to get set up<kedro:get_started/install>`. 

```{important}
We recommend that you use the same version of Kedro that was most recently used to test this tutorial (0.19.0). To check the version installed, type `kedro -V` in your terminal window.
```

In your terminal window, navigate to the folder you want to store the project. Generate the spaceflights tutorial project with all the code in place by using the [Kedro starter for the spaceflights tutorial](https://github.com/kedro-org/kedro-starters/tree/main/spaceflights-pandas):


```bash
kedro new --starter=spaceflights-pandas
```

When prompted for a project name, you can enter anything, but we will assume `Spaceflights` throughout.

When your project is ready, navigate to the root directory of the project. Install the dependencies from the project root directory by typing the following in your terminal:

```bash
pip install -r src/requirements.txt
```

Kedro-Viz requires specific minimum versions of `fsspec[s3]`, and `kedro` to publish your project. Ensure you have these correct versions by updating the `requirements.txt` file of the Kedro project to add the following:

```text
fsspec[s3]>=2023.9.0
kedro>=0.18.2
```

There are two ways to publish and share Kedro-Viz:

1. **Platform-agnostic sharing with Kedro-Viz:** Using the kedro-viz build command, users can publish Kedro-Viz to any static website hosting platform such as GitHub pages, and share the URL generated. This is described in [Platform-agnostic sharing with Kedro-Viz](./platform_agnostic_sharing_with_kedro_viz)

2. **Publish and share Kedro-Viz automatically:** You can automate the process of publishing and sharing your Kedro-Viz through AWS. Once the storage account and credentials are configured, users can then generate a shareable link from the Kedro-Viz UI using the 'Publish and share' button.

```{note}
From Kedro-Viz version 7.2.0, in addition to AWS, you will be able to publish and share your Kedro-Viz on Azure and GCP.
```

* [Publish and share Kedro-Viz on AWS](./publish_and_share_kedro_viz_on_aws)
* [Publish and share Kedro-Viz on Azure](./publish_and_share_kedro_viz_on_azure)
* [Publish and share Kedro-Viz on GCP](./publish_and_share_kedro_viz_on_gcp)

```{toctree}
:caption: Learn about Publish and Share Kedro-Viz
:maxdepth: 2

platform_agnostic_sharing_with_kedro_viz
publish_and_share_kedro_viz_on_aws
publish_and_share_kedro_viz_on_azure
publish_and_share_kedro_viz_on_gcp
```

## Publish and share via CLI

From Kedro-Viz version 7.0.0, you can now publish and share your Kedro-Viz project from the command line. Use the following command from the root folder of your Kedro project

```bash
kedro viz deploy --region=[aws-bucket-region] --bucket-name=[aws-bucket-name]
```

```{important}
From Kedro-Viz version 7.2.0, the `kedro viz deploy` command takes platform, endpoint and bucket name as its options.
```

From Kedro-Viz version 7.2.0, use the following command from the root folder of your Kedro project

```bash
kedro viz deploy --platform=[cloud-provider] --endpoint=[static-website-link] --bucket-name=[bucket-name]
```

```{note}
* **AWS -** The endpoint link can be found under S3 bucket -> properties -> Static website hosting -> Bucket website endpoint.
* **Azure -** The endpoint link can be found under Storage account -> Capabilities -> Static website -> Primary endpoint.
* **GCP -** The endpoint link can be found under your Application Load Balancer -> Frontend -> IP:Port if you are using `HTTP`. 
If you have set up SSL certificate and serve your site using `HTTPS` then provide your root domain.
```