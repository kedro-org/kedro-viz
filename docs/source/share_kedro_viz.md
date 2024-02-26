# Publish and Share Kedro-Viz

Kedro users want to share their pipeline visualisation with other non-technical  stakeholders on their team. 

Kedro enables users to do this by publishing Kedro-Viz to a static website hosting platform to share it with others. This guide uses the spaceflights tutorial as an example.

There are two ways to publish and share Kedro-Viz:

1. **Platform-agnostic sharing with Kedro-Viz:** Using the kedro-viz build command, users can publish Kedro-Viz to any static website hosting platform such as GitHub pages, and share the URL generated. This is described in [Platform-agnostic sharing with Kedro-Viz](./platform_agnostic_sharing_with_kedro_viz)

2. **Publish and share Kedro-Viz automatically:** You can automate the publishing and sharing of your Kedro-Viz through three different cloud providers: AWS, Azure, and GCS. Detailed instructions for each provider are outlined in the sections below.

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

From Kedro-Viz version 8.0.0, the `kedro viz deploy` command takes **platform**, **endpoint** and **bucket name** as its options. You can use the following command from the root folder of your Kedro project

```bash
kedro viz deploy --platform=[cloud-provider] --endpoint=[static-website-link] --bucket-name=[bucket-name]
```

```{note}
* **AWS -** The endpoint link can be found under S3 bucket -> properties -> Static website hosting -> Bucket website endpoint.
* **Azure -** The endpoint link can be found under Storage account -> Capabilities -> Static website -> Primary endpoint.
* **GCP -** The endpoint link can be found under your Application Load Balancer -> Frontend -> IP:Port if you are using `HTTP`. 
If you have set up SSL certificate and serve your site using `HTTPS` then provide your root domain.
```
For AWS only, you can still publish and share Kedro-Viz project using the existing command from Kedro-Viz version 7.0.0.

```bash
kedro viz deploy --region=[aws-bucket-region] --bucket-name=[aws-bucket-name]
```

