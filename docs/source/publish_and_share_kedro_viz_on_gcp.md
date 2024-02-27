# Publish and Share via GCP

This page describes how to publish Kedro-Viz to Azure to share it with others. It uses the spaceflights tutorial as an example.

## Setup your kedro project 

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

## Install cloud dependencies

```bash
pip install 'kedro-viz[gcp]'
```

## Configure your Google Cloud Storage

You can host your Kedro-Viz project on Google Cloud Storage (GCS) bucket. You must first create a Google Cloud Storage account and make your bucket readable to anyone on the public internet. To do so, follow the [GCP tutorial](https://cloud.google.com/storage/docs/hosting-static-website) to configure a static website on GCS.

```{important}
You need to enable the Compute Engine API for your project as mentioned in the tutorial
```

Once the storage account is created and the bucket is made readable to anyone on the public internet, you'll need to set up a load balancer and configure SSL certificate if you want to serve your website through `HTTPS`. To do so, follow the [Setup Load Balancer tutorial](https://cloud.google.com/storage/docs/hosting-static-website#lb-ssl)

Uploading files through Kedro-Viz requires setting GOOGLE_APPLICATION_CREDENTIALS as an environment variable. Create a service account to obtain the required token.

Sign in to the [GCP Portal](https://console.cloud.google.com/) and create a service account from IAM & admin dashboard as shown below

![](./images/gcp_sa.png)

![](./images/gcp_sa_details.png)

You must assign `Storage Object Creator` and `Storage Object User` roles

![](./images/gcp_sa_roles.png)

Ignore granting users access to this service account unless required by your project, then click on Done.

Once the service account is created, you need to generate a service account key as shown below

![](./images/gcp_sa_keys.png)

![](./images/gcp_sa_key_download.png)

![](./images/gcp_sa_key_confirm.png)

### Permissions and access control

GCP manages all permissions and access control. As a user, you have the choice to allow anyone to view your project or restrict access to specific IP addresses, users, or groups.

You can control who can view your visualisation using [IAM permissions and ACLs](https://cloud.google.com/storage/docs/access-control#using_permissions_with_acls). See the official Google documentation for more information.

## Set credentials

Step 3: Once that's completed, you'll need to set your generated service account key file absolute path as environment variable in your terminal window, as shown below:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="absolute-path-to-downloaded-service-account-key-file"
```

For more information, see the official Google documentation about [how to work with environmental credentials](https://cloud.google.com/composer/docs/how-to/managing/environment-variables).


## Publish and share the project

Once your cloud storage is configured and the credentials are set, you are now ready to publish and share your Kedro-Viz project. 

### Publish and share via Kedro-Viz UI 

Start Kedro-Viz by running the following command in your terminal:

```bash
kedro viz run
```

Navigate to the **Publish and share** icon located in the lower-left corner of the application interface. A modal dialog will appear, prompting you to select your hosting platform and provide your bucket name and endpoint link.

The endpoint link can be found under your **Application Load Balancer -> Frontend -> IP:Port** if you are using `HTTP`. 
If you have set up SSL certificate and serve your site using `HTTPS` then provide your root domain.
```

Once those details are complete, click **Publish**. A hosted, shareable URL will be returned to you after the process completes.

![](./images/kedro-publish-share.gif)

### Publish and share via CLI

Use the `kedro viz deploy` command to publish Kedro-viz on Azure. You can execute the following command from your project's root folder:

```bash
kedro viz deploy --platform=azure --endpoint=[azure-endpoint] --bucket-name=[azure-bucket-name]
```

### Billing

You pay for storing objects on your Google Cloud Storage. The amount you pay depends on the amount of data stored, data processing and network usage. Additionally you may be charged for using Cloud Load Balancing.

See the official [Google Cloud Storage Billing](https://cloud.google.com/storage/pricing) and [Google Cloud Load Balancing Billing](https://cloud.google.com/vpc/network-pricing#lb) for more information.
