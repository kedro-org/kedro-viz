# Publish and Share via AWS

This page describes how to publish Kedro-Viz to AWS to share it with others. It uses the spaceflights tutorial as an example.

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
pip install 'kedro-viz[aws]'
```

## Configure your AWS S3 bucket

You can host your Kedro-Viz project on Amazon S3. You must first create an S3 bucket and then enable static website hosting. To do so, follow the [AWS tutorial](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html) to configure a static website on Amazon S3.

Once the S3 bucket is created, you'll need to create an IAM user account, user group, and generate the corresponding access keys. To do so:

Sign in to the [AWS Management Console](https://console.aws.amazon.com/s3/) and create an IAM user account.
For more information, see the official AWS documentation about [IAM Identities](https://docs.aws.amazon.com/IAM/latest/UserGuide/id.html).

![](./images/kedro_viz_share_credentials1.png)

Create a user group from the IAM dashboard, ensuring the user group has full access to the AWS S3 policy.

![](./images/kedro_viz_share_credentials2.png)

For more information, see the official AWS documentation about [IAM user groups](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups.html?icmpid=docs_iam_help_panel).

Add the IAM user to the user group (this is only possible if the group has been created).

![](./images/kedro_viz_share_credentials3.png)

Select the user, then select `Create access key`. Follow the steps and create your keys.

![](./images/kedro_viz_share_credentials4.png)

### Permissions and access control

AWS manages all permissions and access control. As a user, you have the choice to allow anyone to view your project or restrict access to specific IP addresses, users, or groups.

Control who can access your visualization using [bucket and user policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-iam-policies.html) or [access control lists](https://docs.aws.amazon.com/AmazonS3/latest/userguide/acls.html). Refer to the official AWS documentation for further details.


## Set credentials

Once that's completed, you'll need to set your AWS credentials as environment variables in your terminal window, as shown below:

```bash
export AWS_ACCESS_KEY_ID="your_access_key_id"
export AWS_SECRET_ACCESS_KEY="your_secret_access_key"
```

For more information, see the official AWS documentation about [how to work with credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html).


## Publish and share the project

Once your cloud storage is configured and the credentials are set, you are now ready to publish and share your Kedro-Viz project. 

### Publish and share via Kedro-Viz UI 

Start Kedro-Viz by running the following command in your terminal:

```bash
kedro viz run
```

Navigate to the **Publish and share** icon located in the lower-left corner of the application interface. A modal dialog will appear, prompting you to select your hosting platform and provide your bucket name and endpoint link.

The endpoint link can be found under **S3 bucket -> properties -> Static website hosting -> Bucket website endpoint**.

Once those details are complete, click **Publish**. A hosted, shareable URL will be returned to you after the process completes.

![](./images/kedro-publish-share.gif)

```{note}
On Kedro-Viz version 7.0.0, you will see a modal dialog to select your region and bucket name.
```

### Publish and share via CLI

Use the `kedro viz deploy` command to publish Kedro-viz on AWS. You can execute the following command from your project's root folder:

```bash
kedro viz deploy --platform=aws --endpoint=[s3-endpoint] --bucket-name=[s3-bucket-name]
```

If you are on Kedro-viz 7.0.0 you can still publish and share Kedro-Viz project using the existing command 

```bash
kedro viz deploy --region=[aws-bucket-region] --bucket-name=[aws-bucket-name]
```

## Billing

You pay for storing objects in your S3 buckets. The amount you pay depends on your objects’ size, how long you stored the object during the month, and the storage class.

See the official [AWS documentation](https://aws.amazon.com/s3/pricing/?nc=sn&loc=4) for more information.

