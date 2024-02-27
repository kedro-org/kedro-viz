# Publish and share Kedro-Viz

The publish and share feature on Kedro-Viz enables seamless sharing of pipeline visualizations on any static website hosting platform. There are two methods:

1. **Platform-agnostic sharing with Kedro-Viz:** Use the `kedro viz build` command to publish Kedro-Viz to platforms like GitHub pages, sharing the generated URL. This is described in [Platform-agnostic sharing with Kedro-Viz](./platform_agnostic_sharing_with_kedro_viz)

2. **Publish and share Kedro-Viz automatically:** Use the `kedro viz deploy` command to automatically share Kedro-Viz on AWS, Azure, or GCP.  See detailed guides below:
* [Publish and share Kedro-Viz on AWS](./publish_and_share_kedro_viz_on_aws)
* [Publish and share Kedro-Viz on Azure](./publish_and_share_kedro_viz_on_azure)
* [Publish and share Kedro-Viz on GCP](./publish_and_share_kedro_viz_on_gcp)


```{toctree}
:maxdepth: 1
:hidden:
platform_agnostic_sharing_with_kedro_viz
publish_and_share_kedro_viz_on_aws
publish_and_share_kedro_viz_on_azure
publish_and_share_kedro_viz_on_gcp
```

## Publish and share via CLI

Starting from Kedro-Viz version 8.0.0, use the `kedro viz deploy` command with options for `platform`, `endpoint`, and `bucket-name` to publish Kedro-viz on supported platforms such as AWS, Azure and GCP. You can execute the following command from your project's root folder:

```bash
kedro viz deploy --platform=[cloud-provider] --endpoint=[static-website-link] --bucket-name=[bucket-name]
```

```{note}
* **AWS -** The endpoint link can be found under S3 bucket -> properties -> Static website hosting -> Bucket website endpoint.
* **Azure -** The endpoint link can be found under Storage account -> Capabilities -> Static website -> Primary endpoint.
* **GCP -** The endpoint link can be found under your Application Load Balancer -> Frontend -> IP:Port if you are using `HTTP`. 
If you have set up SSL certificate and serve your site using `HTTPS` then provide your root domain.
```


