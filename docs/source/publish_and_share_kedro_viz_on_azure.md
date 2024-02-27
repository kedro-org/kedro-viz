# Publish and share via Azure

This page describes how to publish Kedro-Viz to Azure to share it with others. It uses the spaceflights tutorial as an example.

## Setup your kedro project 

If you haven't installed Kedro {doc}`follow the documentation to get set up<kedro:get_started/install>`. 

```{important}
We recommend that you use the same version of Kedro that was most recently used to test this tutorial (0.19.1). To check the version installed, type `kedro -V` in your terminal window.
```

In your terminal window, navigate to the folder you want to store the project. Generate the spaceflights tutorial project with all the code in place by using the [Kedro starter for the spaceflights tutorial](https://github.com/kedro-org/kedro-starters/tree/main/spaceflights-pandas):


```bash
kedro new --starter=spaceflights-pandas
```

When prompted for a project name, you can enter anything, but we will assume `Spaceflights` throughout.

When your project is ready, navigate to the root directory of the project. Install the dependencies from the project root directory by typing the following in your terminal:

```bash
pip install -r requirements.txt
```

Kedro-Viz requires specific minimum versions of `fsspec[s3]`, and `kedro` to publish your project. Ensure you have these correct versions by updating the `requirements.txt` file of the Kedro project to add the following:

```text
fsspec[s3]>=2023.9.0
kedro>=0.18.2
```

## Install cloud dependencies
 
 Step 1:
 
```bash
pip install 'kedro-viz[azure]'
```

## Configure your Azure Blob Storage

You can host your Kedro-Viz project on Azure Blob Storage. You must first create an Azure Storage account and then enable static website hosting. To do so, follow the [Azure tutorial](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website-how-to?tabs=azure-portal) to configure a static website on AzureBlobStorage.

Once the storage account is created and enabled for static website hosting, you'll need to register an app, get the app registration parameters namely `Application (Client) ID`, `Directory (Tenant) ID`, `Client Secret Value`. To do so:

Sign in to the [AzurePortal](https://portal.azure.com/#home) and create an App registration.
For more information, see the official Azure documentation about [App Registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).

![](./images/azure_app_registration.png)

Upon completion of registration, navigate to the app registration's overview pane to obtain the Application (Client) ID and Directory (Tenant) ID, which will be used to set environment variables.

![](./images/azure_app_secrets.png)

Add a client secret for the app registration. For more information, see [Add a client secret](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#add-a-client-secret)

![](./images/azure_client_secret.png)

Once the client secret is created, the client secrets section is displayed and you can find the client secret value as shown below

![](./images/azure_client_secret_value.png)

Assign Access Control (IAM) role to the storage account. For more information, see [Assign Azure roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal?tabs=delegate-condition)

Go to the storage account that is created and click on Access control (IAM) as shown below

![](./images/azure_iam_tab.png)

Add role assignment and select the role `Storage Blob Data Contributor` as shown below

![](./images/azure_add_role_assign.png)

![](./images/azure_storage_role.png)

On the members tab, select user, group, or service principal to assign the selected role to the app registration. Click on select members, and find your app registration name by typing in the select box. 

![](./images/azure_member_assign.png)

### Permissions and access control

Azure manages all permissions and access control. As a user, you have the choice to allow anyone to view your project or restrict access to specific IP addresses, users, or groups.

You can control who can view your visualisation using [attribute-based access control](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-auth-abac). See the official Azure documentation for more information.

```{note}
Kedro-Viz uses Gen2 filesystem protocol `abfs` to write files on AzureBlobStorage.
```

```{important}
Having a `$web` container in your AzureBlobStorage is mandatory to use Kedro-Viz publish and share feature on Azure. For more information, see the official Azure documentation about 
[Setting up a static website](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website#setting-up-a-static-website).
```

## Set credentials

Step 8: Once that's completed, you'll need to set your Azure credentials as environment variables in your terminal window, as shown below:

```bash
export AZURE_STORAGE_TENANT_ID="your-app-tenant-id"
export AZURE_STORAGE_CLIENT_ID="your-app-client-id"
export AZURE_STORAGE_CLIENT_SECRET="your-app-client-secret-value"
```

For more information, see the official Azure documentation about [how to work with environmental credentials](https://learn.microsoft.com/en-us/dotnet/api/azure.identity.environmentcredential?view=azure-dotnet).


## Publish and share the project

Once your cloud storage is configured and the credentials are set, you are now ready to publish and share your Kedro-Viz project. 

### Publish and share via Kedro-Viz UI 

Start Kedro-Viz by running the following command in your terminal:

```bash
kedro viz run
```

Navigate to the **Publish and share** icon located in the lower-left corner of the application interface. A modal dialog will appear, prompting you to select your hosting platform and provide your bucket name and endpoint link.

The endpoint link can be found under **Storage account -> Capabilities -> Static website -> Primary endpoint**.

Once those details are complete, click **Publish**. A hosted, shareable URL will be returned to you after the process completes.

![](./images/kedro-publish-share.gif)

### Publish and share via CLI

Use the `kedro viz deploy` command to publish Kedro-viz on Azure. You can execute the following command from your project's root folder:

```bash
kedro viz deploy --platform=azure --endpoint=[azure-endpoint] --bucket-name=[azure-bucket-name]
```

## Billing

You pay for storing objects on your AzureBlobStorage. The amount you pay depends on the volume of data stored per month, quantity and types of operations performed, along with any data transfer costs, data redundancy option selected.

See the official [Azure documentation](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/) for more information.
