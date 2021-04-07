if (
    !process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL ||
    !process.env.NEXT_PUBLIC_EOS_RPC_HOST ||
    !process.env.NEXT_PUBLIC_EOS_RPC_PORT ||
    !process.env.NEXT_PUBLIC_EOS_CHAIN_ID ||
    !process.env.NEXT_PUBLIC_AA_CONTRACT ||
    !process.env.NEXT_PUBLIC_AA_COLLECTION_NAME ||
    !process.env.NEXT_PUBLIC_AA_SCHEMA_NAME ||
    !process.env.NEXT_PUBLIC_APP_SHORT_NAME ||
    !process.env.NEXT_PUBLIC_APP_NAME
) {
    throw new Error("Eden WebApp Environment Variables are not set");
}

export const shortAppName = process.env.NEXT_PUBLIC_APP_SHORT_NAME;
export const appName = process.env.NEXT_PUBLIC_APP_NAME;

export const atomicAssets = {
    contract: process.env.NEXT_PUBLIC_AA_CONTRACT,
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
