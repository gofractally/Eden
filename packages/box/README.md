# EdenOS Box

Box is a utility server to extend Eden App functionalities like uploading, compressing and pinning big files to IPFS.

## Box Settings

When deploying the box you can set up all of the configuration using environment variables. Most of them are self explanatory and can be easily digestable by looking at the `.env` file. Here are some important ones that you must know how to set:

-   `EOS_CHAIN_ID`, `EOS_RPC_PROTOCOL`, `EOS_RPC_HOST`, `EOS_RPC_PORT`: This is the configuration related to the EOS Blockchain that the box supports (generally for parsing aciton ABIs and broadcasting transactions).
-   `IPFS_PINATA_JWT`: the box has a file upload endpoint that receives a file and upload to IPFS using Pinata API. Set here your Pinata JWT that has permission to `pinFileToIPFS`.

### Supported Eden Actions Upload

The way that the box accept or reject an uploaded file is by extracting the file IPFS CID from the relevant transaction field and checking if the uploaded file hash matches. Then the transaction is broadcast and if successful, the file is pinned to IPFS.

This way we validate that only relevant files from valid signed Eden transactions are pinned.

The box comes with predefined configuration of all of the eden transactions in the `config.ts` file:

```ts
export const validUploadActions: ValidUploadActions = {
    [edenContractAccount]: {
        inductprofil: {
            maxSize: 1_000_000,
            cidField: "new_member_profile.img",
        },
        inductvideo: { maxSize: 100_000_000, cidField: "video" },
    },
};
```

In the above configuration we are defining that we support two eden contract actions: `inductprofil` and `inductvideo` (both belong to the induction process). Looking at the `inductprofil` we can observe that the CID of the uploaded file will be found in the action field `new_member_profile.img` and the limit is **1 Mb** for the profile image. Whereas for the `inductvideo`, the CID is on `video` field and supports a maximum file size of **100 Mb**.

Right now we don't support a configurable way of supporting new actions. You would need to change the `config.ts` and recompile the code. We will always keep this config maintained with what is required by Eden but we also have plans to make it more flexible to handle another contract uploads in the box as well.

## Building Image and Publishing to GHCR

```sh
# from repository root
docker build -t eden/box -f docker/eden-box.Dockerfile .
docker image tag eden/box ghcr.io/eoscommunity/eden-box:latest
docker image push ghcr.io/eoscommunity/eden-box:latest
```

## Deploying Edenbox

Just go to your server docker panel and get the edenbox latest version: `ghcr.io/eoscommunity/eden-box:latest`

All the published versions are listed here: https://github.com/eoscommunity/Eden/pkgs/container/eden-box/versions
