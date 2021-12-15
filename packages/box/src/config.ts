import { ValidUploadActions } from "@edenos/common";

import * as packageJson from "../package.json";
import logger from "./logger";

require("dotenv-flow").config();

logger.info("==> Loading Env Configs...");

export const env = process.env.NODE_ENV || "development";
console.info(env);

export const serverConfig = {
    appName: process.env.APP_NAME || packageJson.name,
    appVersion: packageJson.version,
    host: process.env.SERVER_HOST || "localhost",
    port: process.env.SERVER_PORT || "3032",
};
console.info(serverConfig);

export const rpcEndpoint = {
    protocol: process.env.EOS_RPC_PROTOCOL || "https",
    host: process.env.EOS_RPC_HOST || "wax-test.eosdac.io",
    port: Number(process.env.EOS_RPC_PORT || "443"),
    chainId: process.env.EOS_CHAIN_ID || "",
    taposManagerInterval: Number(
        process.env.TAPOS_MANAGER_INTERVAL_MINS || "30"
    ),
};
console.info(rpcEndpoint);

export const edenContractAccount =
    process.env.EDEN_CONTRACT_ACCOUNT || "test.edev";
console.info(edenContractAccount);

export const ipfsConfig = {
    pinataPinFileUrl:
        process.env.IPFS_PINATA_PIN_FILE_URL ||
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
    pinataJwt: process.env.IPFS_PINATA_JWT || "<pinata-jwt-here>",
};
console.info({
    ...ipfsConfig,
    pinataJwt: `<secret>`,
});

export const validUploadActions: ValidUploadActions = {
    [edenContractAccount]: {
        inductprofil: {
            maxSize: 1_000_000,
            cidField: "new_member_profile.img",
        },
        inductvideo: { maxSize: 100_000_000, cidField: "video" },
        electvideo: {
            maxSize: 1_000_000_000,
            cidField: "video",
        },
    },
};
logger.info(
    "Supported EOS IPFS Upload Actions\n" +
        JSON.stringify(validUploadActions, undefined, 2)
);

export const serverPaysConfig = {
    serverPaysPrivateKey: process.env.SERVER_PAYS_PRIVATE_KEY || "<secret-pk>",
    serverPaysAccount: process.env.SERVER_PAYS_ACCOUNT || "payer",
    serverPaysPermission: process.env.SERVER_PAYS_PERMISSION || "active",
    serverPaysNoopContract: process.env.SERVER_PAYS_NOOP_CONTRACT || "payer",
    serverPaysNoopAction: process.env.SERVER_PAYS_NOOP_ACTION || "noop",
    serverPaysCreateABI: process.env.SERVER_PAYS_CREATE_ABI === "true",
};
logger.info(
    "Sessions Config\n" +
        JSON.stringify(
            { ...serverPaysConfig, serverPaysPrivateKey: "<secret>" },
            undefined,
            2
        )
);

export const enableEdenSessions = process.env.SESSIONS_ENABLE === "true";

export enum SubchainReceivers {
    UNKNOWN,
    DFUSE,
    SHIP,
}

export const subchainConfig = {
    enable: !("SUBCHAIN_DISABLE" in process.env),
    eden: process.env.SUBCHAIN_EDEN_CONTRACT || "genesis.eden",
    token: process.env.SUBCHAIN_TOKEN_CONTRACT || "eosio.token",
    atomic: process.env.SUBCHAIN_AA_CONTRACT || "atomicassets",
    atomicMarket: process.env.SUBCHAIN_AA_MARKET_CONTRACT || "atomicmarket",
    wasmFile: process.env.SUBCHAIN_WASM || "../../build/eden-micro-chain.wasm",
    stateFile: process.env.SUBCHAIN_STATE || "state",
    receiver:
        SubchainReceivers[
            (process.env.SUBCHAIN_RECEIVER ||
                "DFUSE") as keyof typeof SubchainReceivers
        ],
};
console.info(subchainConfig);

export const dfuseConfig = {
    apiKey: process.env.DFUSE_API_KEY || "",
    apiNetwork: process.env.DFUSE_API_NETWORK || "eos.dfuse.eosnation.io",
    authNetwork: process.env.DFUSE_AUTH_NETWORK || "https://auth.eosnation.io",
    firstBlock: +(process.env.DFUSE_FIRST_BLOCK as any) || 1,
    jsonTrxFile: process.env.DFUSE_JSON_TRX_FILE || "dfuse-transactions.json",
    interval:
        "DFUSE_INTERVAL" in process.env
            ? +(process.env.DFUSE_INTERVAL as any)
            : 30,
    preventConnect: "DFUSE_PREVENT_CONNECT" in process.env,
};

export const shipConfig = {
    address: process.env.SHIP_ADDRESS || "127.0.0.1",
    port: process.env.SHIP_PORT || "8080",
    firstBlock: +(process.env.SHIP_FIRST_BLOCK as any) || 1,
};

if (subchainConfig.enable) {
    logger.info("Using Subchain Receiver: %s", subchainConfig.receiver);
    switch (subchainConfig.receiver) {
        case SubchainReceivers.DFUSE: {
            console.info({ ...dfuseConfig, apiKey: "<secret>" });
            break;
        }
        case SubchainReceivers.SHIP: {
            console.info(shipConfig);
            break;
        }
        default: {
            const error = "Invalid Subchain Receiver";
            logger.error(error);
            throw new Error(error);
        }
    }
}

logger.info("<== Env Configs Loaded!");
