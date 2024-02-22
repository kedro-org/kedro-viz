# Publish and Share via Azure

## Step 1: Install dependencies

```bash
pip install 'kedro-viz[azure]'
```

## Step 2: Configure your Azure Blob Storage

You can host your Kedro-Viz project on AzureBlobStorage. You must first create an Azure Storage account and then enable static website hosting. To do so, follow the [Azure tutorial](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website-how-to?tabs=azure-portal) to configure a static website on AzureBlobStorage.

```{note}
Uploading your site's files will be done through Kedro-Viz
```

Once the storage account is created and enabled for static website hosting, you'll need to register an app, get the app registration parameters namely `Application (Client) ID`, `Directory (Tenant) ID`, `Client Secret Value`. To do so:

Sign in to the [AzurePortal](https://portal.azure.com/#home) and create an App registration.
For more information, see the official Azure documentation about [App Registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).

![](./images/azure_app_registration.png)

When registration finishes, the app registration's Overview pane is displayed. You see the Application (Client) ID and Directory (Tenant) ID. We will use these values to set our environment variables.

![](./images/azure_app_secrets.png)

Add a Client Secret for the app registration. For more information, see [Add a client secret](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#add-a-client-secret)

![](./images/azure_client_secret.png)

Once the Client Secret is created, the Client secrets section is displayed and you can find the Client Secret Value as shown below

![](./images/azure_client_secret_value.png)

Assign Access Control (IAM) role to the storage account. For more information, see [Assign Azure roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal?tabs=delegate-condition)

Go to the storage account that is created and click on Access control (IAM) as shown below

![](./images/azure_iam_tab.png)

Add role assignment and select the role `Storage Blob Data Contributor` as shown below

![](./images/azure_add_role_assign.png)

![](./images/azure_storage_role.png)

On the Members tab, select User, group, or service principal to assign the selected role to the app registration. Click on Select members, and find your app registration name by typing in the Select box as shown below 

![](./images/azure_member_assign.png)

## Step 3: Set credentials

Once that's completed, you'll need to set your Azure credentials as environment variables in your terminal window, as shown below:

```bash
export AZURE_STORAGE_TENANT_ID="your-app-tenant-id"
export AZURE_STORAGE_CLIENT_ID="your-app-client-id"
export AZURE_STORAGE_CLIENT_SECRET="your-app-client-secret-value"
```

For more information, see the official Azure documentation about [how to work with environmental credentials](https://learn.microsoft.com/en-us/dotnet/api/azure.identity.environmentcredential?view=azure-dotnet).

```{note}
Kedro-Viz uses Gen2 filesystem protocol `abfs` to write files on AzureBlobStorage.
```

```{important}
Having a `$web` container in your AzureBlobStorage is mandatory to use Kedro-Viz publish and share feature on Azure. For more information, see the official Azure documentation about 
[Setting up a static website](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website#setting-up-a-static-website).
```

### Permissions and access control

All permissions and access control are controlled by Azure. It's up to you, the user, if you want to allow anyone to see your project or limit access to certain IP addresses, users, or groups.

You can control who can view your visualisation using [attribute-based access control](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-auth-abac). See the official Azure documentation for more information.

### Billing

You pay for storing objects on your AzureBlobStorage. The amount you pay depends on the volume of data stored per month, quantity and types of operations performed, along with any data transfer costs, data redundancy option selected.

See the official [Azure documentation](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/) for more information.


## Step 4: Publish and share the project
Once your Cloud storage is configured and the credentials are set, you are now ready to publish and share your Kedro-Viz project. Start Kedro-Viz by running the following command in your terminal:

```bash
kedro viz run
```

Click the **Publish and share** icon in the lower-left of the application. You will see a modal dialog to select your relevant AWS Bucket Region and enter your Bucket Name.

```{note}
From Kedro-Viz version 7.2.0, you will see a modal dialog to select your hosting platform, input your bucket name and endpoint link. The endpoint link can be found under **Storage account -> Capabilities -> Static website -> Primary endpoint**.
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
* **Azure -** The endpoint link can be found under Storage account -> Capabilities -> Static website -> Primary endpoint.
* **GCP -** The endpoint link can be found under your Application Load Balancer -> Frontend -> IP:Port if you are using `HTTP`. 
If you have set up SSL certificate and serve your site using `HTTPS` then provide your root domain.
```

