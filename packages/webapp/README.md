# Eden Web App

This is the frontend that you see when you access the Eden portal. We use Next.js to have Server Side Rendering capabilities and performance niceties.

While it depends on a server now we intend this to be a thin PWA client or Electron App not being dependent in any external infra as we evolve.

## Web App Settings

### Setting Environment Variables

When running the webapp you can setup all of the configuration using environment variables. Any environment variable prefixed with `NEXT_PUBLIC_` are exposed to the client; secrets should never use this prefix.

Environment variables are defined `.env` file. Most should be self-explanatory. When running locally, these can be overridden on a variable-by-variable basis in a `.env.local` file. This is a good place to include any secrets as those should not be checked in.

When deployed for production, environment variables can be overridden by setting environment variables in your host. In Vercel, for example, environment variables can be set individually for production, development and preview (branch) environments.

### Helpful Local Environment Variables

-   `NEXT_PUBLIC_AA_COLLECTION_NAME` and `NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT`: Change these to point to a different contract. For example, `"test2.edev"`.
-   `NEXT_PUBLIC_AA_FETCH_AFTER`: Seeing more NFTs than members in a test environment? It may be because the contract has been reset and you're seeing members from past tests. To filter those out, set the `NEXT_PUBLIC_AA_FETCH_AFTER` environment variable in your `.env.local` file to the approximate UNIX timestamp, in milliseconds, of the new contract deployment. (\_E.g., `NEXT_PUBLIC_AA_FETCH_AFTER="1626286021000"`.
-   `NEXT_PUBLIC_DEV_USE_FIXTURE_DATA`: If you want to test against hard-coded fixture data (for certain features currently under development), set this to `true`: `NEXT_PUBLIC_DEV_USE_FIXTURE_DATA="true"`.

### IPFS Upload Handlers

There are currently two options for managing IPFS upload and pinning:

#### Infura + NextJS + pinata.cloud

The client uploads the file directly to Infura's free (but limited) IPFS service. Once uploaded, our app's Next.js serverless `ipfs-upload` API handler pins the file using pinata.cloud (to guarantee the file remains available for download via the IPFS network.)

This is fine for getting started, but it does hae some limitations. For example, Infura's free service seems to have a cap at 100 MB per file. We anticipate election video recordings to surpass that limit, though. Furthermore, Infura is an extra dependency that we have no control over.

To use this option:

-   `NEXT_PUBLIC_BOX_UPLOAD_IPFS` should be set to `false`
-   `IPFS_PINATA_JWT` should be set to an API JWT provided by Pinata. Set up a new API key in pinata.cloud with permissions to the Pinning Services API's `addPinObject`, `getPinObject` and `listPinObject`.

#### Eden Box + pinata.cloud

The client uploads the file to our own [Eden Box](../box) service, which, in turn, uploads and pins the file to the IPFS network via pinata.cloud. The file is uploaded together with the related signed transaction so that it can be validated against the transaction and a whitelist prior to pinning.

This is nice because we remove the dependency on Infura, but there is a bit more complexity in running the Eden Box service. More info on that [here](../box/README.md).

To use this option:

-   `NEXT_PUBLIC_BOX_UPLOAD_IPFS` should be set to `true`
-   `NEXT_PUBLIC_BOX_ADDRESS` must point to your box, wherever it's deployed
-   The `IPFS_PINATA_JWT` is _not_ needed in the webapp enviroment

When running the Eden application locally using `yarn dev --stream`, the Box service will start up on its configured port (default 3032) and can be accessed by the local frontend directly. To do so, set `NEXT_PUBLIC_BOX_ADDRESS` in your `.env.local` file to point to your local box port (_e.g._, `http://localhost:3032`).

A pinata.cloud API JWT will still be needed, but that's set in the Box environment variables, and instead requires the pinata.cloud `pinFileToIPFS` permission.

#### Other Considerations

If you want to enable uploads greater than 100 MB, use the Eden Box option. And we recommend a paid account with [pinata.cloud](https://pinata.cloud).

If the future, we will explore ways to remove our dependency on pinata.cloud too.
