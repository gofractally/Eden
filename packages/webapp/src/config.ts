import { assetFromString } from "./_app/utils/asset";

if (
    !process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL ||
    !process.env.NEXT_PUBLIC_EOS_RPC_HOST ||
    !process.env.NEXT_PUBLIC_EOS_RPC_PORT ||
    !process.env.NEXT_PUBLIC_EOS_CHAIN_ID ||
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
    !process.env.NEXT_PUBLIC_APP_MINIMUM_DONATION_AMOUNT
) {
    throw new Error("Eden WebApp Environment Variables are not set");
}

console.info(`>>> Loaded Configs:
EOS_RPC_PROTOCOL="${process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL}"
EOS_RPC_HOST="${process.env.NEXT_PUBLIC_EOS_RPC_HOST}"
EOS_RPC_PORT="${process.env.NEXT_PUBLIC_EOS_RPC_PORT}"
EOS_CHAIN_ID="${process.env.NEXT_PUBLIC_EOS_CHAIN_ID}"
AA_BASE_URL="${process.env.NEXT_PUBLIC_AA_BASE_URL}"
AA_MARKET_URL="${process.env.NEXT_PUBLIC_AA_MARKET_URL}"
AA_HUB_URL="${process.env.NEXT_PUBLIC_AA_HUB_URL}"
AA_CONTRACT="${process.env.NEXT_PUBLIC_AA_CONTRACT}"
AA_MARKET_CONTRACT="${process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT}"
AA_COLLECTION_NAME="${process.env.NEXT_PUBLIC_AA_COLLECTION_NAME}"
AA_SCHEMA_NAME="${process.env.NEXT_PUBLIC_AA_SCHEMA_NAME}"
APP_SHORT_NAME="${process.env.NEXT_PUBLIC_APP_SHORT_NAME}"
APP_NAME="${process.env.NEXT_PUBLIC_APP_NAME}"
EDEN_CONTRACT_ACCOUNT="${process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT}"
APP_MINIMUM_DONATION_AMOUNT="${process.env.NEXT_PUBLIC_APP_MINIMUM_DONATION_AMOUNT}"
`);

export const ipfsBaseUrl = "https://ipfs.io/ipfs"; //"https://ipfs.pink.gg/ipfs";

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
