# Eden Webapp

This is the frontend that you see when you access the Eden portal. We use Next.js to have Server Side Rendering capabilities and performance niceties.

While it depends on a server now we intend this to be a thin PWA client or Electron App not being dependent in any external infra as we evolve.

## Webapp Settings

When running the webapp you can setup all of the configuration using environment variables. Most of them are self explanatory and can be easily digestable by looking at the `.env` file.

It follows the same pattern as any Next.js "dot-env" settings where `NEXT_PUBLIC_` are exposed to the client, so never set a secret there.

### IPFS Upload Handlers

We have two ways of uploading to IPFS right now:

1. Uploading the file to the public Infura Upload API and then pinning the CID it using Pinata in our Serverless NextJs `ipfs-upload` API handler. The advantage of this is that we can upload from the client to a public IPFS node but it usually has some limiting caps, eg: Infura cap at 100 Mb file sizes, not being usable for the Election videos (which we foresee being Average of ~500mb).
2. Uploading the file to an Eden Box with a signed transaction altogether. In this method we need to have an instantiated Eden Box that accepts transactions with uploaded files which will validate them, upload to an IPFS node and pin it. See more info about the box uploads [here](/packages/box/README.md).
