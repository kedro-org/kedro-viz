# Publish and share Kedro-Viz

The publish and share feature on Kedro-Viz enables seamless sharing of pipeline visualizations on any static website hosting platform. There are two methods:

1. **Platform-agnostic sharing with Kedro-Viz:** Use the `kedro viz build` command to publish Kedro-Viz on platforms like GitHub pages, sharing the generated URL. This is described in [Platform-agnostic sharing with Kedro-Viz](./platform_agnostic_sharing_with_kedro_viz)

2. **Publish and share Kedro-Viz automatically:** Use the `kedro viz deploy` command to automatically share Kedro-Viz on AWS, Azure, or GCP.  See detailed guides below:
* [Publish and share on AWS](./publish_and_share_kedro_viz_on_aws)
* [Publish and share on Azure](./publish_and_share_kedro_viz_on_azure)
* [Publish and share on GCP](./publish_and_share_kedro_viz_on_gcp)

3. **Publish and Share Kedro-Viz with Github Actions**: Use the `publish-kedro-viz` action available on the Github Marketplace to deploy Kedro-Viz for your Kedro project repository on GitHub Pages. For further information and usage instructions, please refer to [publish-kedro-viz](https://github.com/marketplace/actions/publish-kedro-viz)

```{toctree}
:maxdepth: 1
:hidden:
platform_agnostic_sharing_with_kedro_viz
publish_and_share_kedro_viz_on_aws
publish_and_share_kedro_viz_on_azure
publish_and_share_kedro_viz_on_gcp
```

