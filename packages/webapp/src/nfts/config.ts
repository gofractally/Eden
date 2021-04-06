import { Anchor } from "ual-anchor";

export const shortAppName = "eden-community-app";
export const appName = "Eden Community App";

if (
    !process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL ||
    !process.env.NEXT_PUBLIC_EOS_RPC_HOST ||
    !process.env.NEXT_PUBLIC_EOS_RPC_PORT ||
    !process.env.NEXT_PUBLIC_EOS_CHAIN_ID
) {
    throw new Error("EOS Chain Environment Variables are not set");
}

export const rpcEndpoint = {
    protocol: process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL,
    host: process.env.NEXT_PUBLIC_EOS_RPC_HOST,
    port: Number(process.env.NEXT_PUBLIC_EOS_RPC_PORT),
};

export const chainConfig = {
    chainId: process.env.NEXT_PUBLIC_EOS_CHAIN_ID,
    rpcEndpoints: [rpcEndpoint],
};

export const anchor = new Anchor([chainConfig], {
    // Required: The app name, required by anchor-link. Short string identifying the app
    appName: shortAppName,
    // Optional: a @greymass/eosio APIClient from eosjs for both your use and to use internally in UAL
    // client = new APIClient({ provider }),
    // Optional: a JsonRpc instance from eosjs for your use
    // rpc: new JsonRpc(),
    // Optional: The callback service URL to use, defaults to https://cb.anchor.link
    // service: 'https://cb.anchor.link',
    // Optional: A flag to disable the Greymass Fuel integration, defaults to false (enabled)
    disableGreymassFuel: true,
    // Optional: An account name on a Fuel enabled network to specify as the referrer for transactions
    // fuelReferrer: 'teamgreymass',
    // Optional: A flag to enable the Anchor Link UI request status, defaults to true (enabled)
    // requestStatus: true,
    // Optional: Whether or not to verify the signatures during user login, defaults to false (disabled)
    // verifyProofs: false,
});
