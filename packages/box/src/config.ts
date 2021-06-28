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
console.info({ ...ipfsConfig, pinataJwt: "<secret>" });

export const validUploadActions: ValidUploadActions = {
    [edenContractAccount]: {
        inductprofil: {
            maxSize: 1_000_000,
            cidField: "new_member_profile.img",
        },
        inductvideo: { maxSize: 1_400_000_000, cidField: "video" },
    },
};
logger.info(
    "Supported EOS IPFS Upload Actions\n" +
        JSON.stringify(validUploadActions, undefined, 2)
);

logger.info("<== Env Configs Loaded!");
