import { ValidUploadActions } from "@edenos/common";
import { assetFromString } from "./_app/utils/asset";

if (
    !process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL ||
    !process.env.NEXT_PUBLIC_EOS_RPC_HOST ||
    !process.env.NEXT_PUBLIC_EOS_RPC_PORT ||
    !process.env.NEXT_PUBLIC_EOS_CHAIN_ID ||
    !process.env.NEXT_PUBLIC_BLOCKEXPLORER_ACCOUNT_BASE_URL ||
    !process.env.NEXT_PUBLIC_AA_BASE_URL ||
    !process.env.NEXT_PUBLIC_AA_MARKET_URL ||
    !process.env.NEXT_PUBLIC_AA_HUB_URL ||
    !process.env.NEXT_PUBLIC_AA_CONTRACT ||
    !process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT ||
    !process.env.NEXT_PUBLIC_AA_COLLECTION_NAME ||
    !process.env.NEXT_PUBLIC_AA_SCHEMA_NAME ||
    !process.env.NEXT_PUBLIC_APP_SHORT_NAME ||
    !process.env.NEXT_PUBLIC_APP_NAME ||
    !process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT ||
    !process.env.NEXT_PUBLIC_APP_MINIMUM_DONATION_AMOUNT ||
    !process.env.NEXT_PUBLIC_ENABLED_WALLETS ||
    !process.env.NEXT_PUBLIC_BOX_UPLOAD_IPFS ||
    !process.env.NEXT_PUBLIC_BOX_ADDRESS ||
    !process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID
) {
    throw new Error("Eden WebApp Environment Variables are not set");
}

console.info(`>>> Loaded Configs:
EOS_RPC_PROTOCOL="${process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL}"
EOS_RPC_HOST="${process.env.NEXT_PUBLIC_EOS_RPC_HOST}"
EOS_RPC_PORT="${process.env.NEXT_PUBLIC_EOS_RPC_PORT}"
EOS_CHAIN_ID="${process.env.NEXT_PUBLIC_EOS_CHAIN_ID}"
BLOCKEXPLORER_ACCOUNT_BASE_URL="${
    process.env.NEXT_PUBLIC_BLOCKEXPLORER_ACCOUNT_BASE_URL
}"
AA_BASE_URL="${process.env.NEXT_PUBLIC_AA_BASE_URL}"
AA_MARKET_URL="${process.env.NEXT_PUBLIC_AA_MARKET_URL}"
AA_HUB_URL="${process.env.NEXT_PUBLIC_AA_HUB_URL}"
AA_CONTRACT="${process.env.NEXT_PUBLIC_AA_CONTRACT}"
AA_MARKET_CONTRACT="${process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT}"
AA_COLLECTION_NAME="${process.env.NEXT_PUBLIC_AA_COLLECTION_NAME}"
AA_SCHEMA_NAME="${process.env.NEXT_PUBLIC_AA_SCHEMA_NAME}"
AA_FETCH_AFTER="${process.env.NEXT_PUBLIC_AA_FETCH_AFTER || "[NOT SET]"}"
APP_SHORT_NAME="${process.env.NEXT_PUBLIC_APP_SHORT_NAME}"
APP_NAME="${process.env.NEXT_PUBLIC_APP_NAME}"
EDEN_CONTRACT_ACCOUNT="${process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT}"
APP_MINIMUM_DONATION_AMOUNT="${
    process.env.NEXT_PUBLIC_APP_MINIMUM_DONATION_AMOUNT
}"
ENABLED_WALLETS="${process.env.NEXT_PUBLIC_ENABLED_WALLETS}"
BOX_UPLOAD_IPFS="${process.env.NEXT_PUBLIC_BOX_UPLOAD_IPFS}"
BOX_ADDRESS="${process.env.NEXT_PUBLIC_BOX_ADDRESS}"
ZOOM_CLIENT_ID="${process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID}"
`);

console.info(`>>> Dev Configs:
DEV_USE_FIXTURE_DATA="${
    process.env.NEXT_PUBLIC_DEV_USE_FIXTURE_DATA === "true"
}"
`);

export const ipfsBaseUrl = "https://ipfs.io/ipfs"; //"https://ipfs.pink.gg/ipfs";
export const ipfsApiBaseUrl = "https://ipfs.infura.io:5001/api/v0";

export const box = {
    enableIpfsUpload: process.env.NEXT_PUBLIC_BOX_UPLOAD_IPFS === "true",
    address: process.env.NEXT_PUBLIC_BOX_ADDRESS || "http://localhost:3032",
};

export const blockExplorerAccountBaseUrl =
    process.env.NEXT_PUBLIC_BLOCKEXPLORER_ACCOUNT_BASE_URL;

export const shortAppName = process.env.NEXT_PUBLIC_APP_SHORT_NAME;
export const appName = process.env.NEXT_PUBLIC_APP_NAME;
export const edenContractAccount =
    process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT;
export const minimumDonationAmount = assetFromString(
    process.env.NEXT_PUBLIC_APP_MINIMUM_DONATION_AMOUNT
);

export const atomicAssets = {
    hubUrl: process.env.NEXT_PUBLIC_AA_HUB_URL,
    apiBaseUrl: process.env.NEXT_PUBLIC_AA_BASE_URL,
    apiMarketUrl: process.env.NEXT_PUBLIC_AA_MARKET_URL,
    contract: process.env.NEXT_PUBLIC_AA_CONTRACT,
    marketContract: process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT,
    collection: process.env.NEXT_PUBLIC_AA_COLLECTION_NAME,
    schema: process.env.NEXT_PUBLIC_AA_SCHEMA_NAME,
    fetchAfter: process.env.NEXT_PUBLIC_AA_FETCH_AFTER,
};

export const rpcEndpoint = {
    protocol: process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL,
    host: process.env.NEXT_PUBLIC_EOS_RPC_HOST,
    port: Number(process.env.NEXT_PUBLIC_EOS_RPC_PORT),
};

export const chainConfig = {
    chainId: process.env.NEXT_PUBLIC_EOS_CHAIN_ID,
    rpcEndpoints: [rpcEndpoint],
};

export const availableWallets = (
    process.env.NEXT_PUBLIC_ENABLED_WALLETS || ""
).split(",");

export const validUploadActions: ValidUploadActions = {
    [edenContractAccount]: {
        inductprofil: {
            maxSize: 1_000_000,
            cidField: "new_member_profile.img",
        },
        inductvideo: { maxSize: 100_000_000, cidField: "video" },
    },
};

// SECRETS CONFIG
if (
    typeof window === "undefined" &&
    (!process.env.IPFS_PINATA_API ||
        !process.env.IPFS_PINATA_JWT ||
        !process.env.JOBS_AUTH_GC ||
        !process.env.EOS_PRIVATE_KEY_GC_JOB ||
        !process.env.ZOOM_CLIENT_SECRET)
) {
    throw new Error("Missing Config Secrets are not set");
}

export const ipfsConfig = {
    pinataApi: process.env.IPFS_PINATA_API || "",
    pinataJwt: process.env.IPFS_PINATA_JWT || "",
};

export const jobKeys = {
    gc: process.env.JOBS_AUTH_GC || "",
};

export const eosPrivateKeys = {
    gcJob: process.env.EOS_PRIVATE_KEY_GC_JOB || "",
};

// DEV CONFIGS
export const devUseFixtureData =
    process.env.NEXT_PUBLIC_DEV_USE_FIXTURE_DATA === "true";

export const zoom = {
    clientKey: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID || "",
    clientSecret: process.env.ZOOM_CLIENT_SECRET || "",
};
