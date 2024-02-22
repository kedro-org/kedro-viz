# Publish and Share via AWS

## Step 1: Install dependencies

```bash
pip install 'kedro-viz[aws]'
```

## Step 2: Configure your AWS S3 bucket

You can host your Kedro-Viz project on Amazon S3. You must first create an S3 bucket and then enable static website hosting. 

To do so, follow the [AWS tutorial](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html) to configure a static website on Amazon S3.

Once the S3 bucket is created, you'll need to create an Identity and Access Management (IAM) user account, user group, and generate the corresponding access keys. To do so:

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


## Step 3: Set credentials
Once that's completed, you'll need to set your AWS credentials as environment variables in your terminal window, as shown below:

```bash
export AWS_ACCESS_KEY_ID="your_access_key_id"
export AWS_SECRET_ACCESS_KEY="your_secret_access_key"
```

For more information, see the official AWS documentation about [how to work with credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html).

### Permissions and access control

All permissions and access control are controlled by AWS. It's up to you, the user, if you want to allow anyone to see your project or limit access to certain IP addresses, users, or groups.

You can control who can view your visualisation using [bucket and user policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-iam-policies.html) or [access control lists](https://docs.aws.amazon.com/AmazonS3/latest/userguide/acls.html). See the official AWS documentation for more information.

### Billing

You pay for storing objects in your S3 buckets. The amount you pay depends on your objects’ size, how long you stored the object during the month, and the storage class.

See the official [AWS documentation](https://aws.amazon.com/s3/pricing/?nc=sn&loc=4) for more information.

## Step 4: Publish and share the project
Once your Cloud storage is configured and the credentials are set, you are now ready to publish and share your Kedro-Viz project. Start Kedro-Viz by running the following command in your terminal:

```bash
kedro viz run
```

Click the **Publish and share** icon in the lower-left of the application. You will see a modal dialog to select your relevant AWS Bucket Region and enter your Bucket Name.

```{note}
From Kedro-Viz version 8.0.0, you will see a modal dialog to select your hosting platform, input your bucket name and endpoint link. The endpoint link can be found under **S3 bucket -> properties -> Static website hosting -> Bucket website endpoint**.
```

Once those details are complete, click **Publish**. A hosted, shareable URL will be returned to you after the process completes.

Here is an example of the flow (TODO - Need to add flows specific to cloud provider):

![](./images/kedro-publish-share.gif)

```{note}
We will be updating the user flow doc for v7.2.0 soon...
```

## Publish and share via CLI

From Kedro-Viz version 8.0.0, the `kedro viz deploy` command takes **platform**, **endpoint** and **bucket name** as its options. You can use the following command from the root folder of your Kedro project

```bash
kedro viz deploy --platform=[cloud-provider] --endpoint=[static-website-link] --bucket-name=[bucket-name]
```

```{note}
* **AWS -** The endpoint link can be found under S3 bucket -> properties -> Static website hosting -> Bucket website endpoint.
```

You can still publish and share Kedro-Viz project using the existing command from Kedro-Viz version 7.0.0.

```bash
kedro viz deploy --region=[aws-bucket-region] --bucket-name=[aws-bucket-name]
```
