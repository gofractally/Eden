import * as packageJson from "../package.json";
import logger from "./logger";

require("dotenv-flow").config();

logger.info("==> Loading Env Configs...");

export const env = process.env.NODE_ENV || "development";
console.info(env);

export const contractAccounts = {
    eden: process.env.EDEN_CONTRACT || "genesis.eden",
    token: process.env.TOKEN_CONTRACT || "eosio.token",
    atomic: process.env.AA_CONTRACT || "atomicassets",
    atomicMarket: process.env.AA_MARKET_CONTRACT || "atomicmarket",
};
console.info(contractAccounts);

export const serverConfig = {
    appName: process.env.APP_NAME || packageJson.name,
    appVersion: packageJson.version,
    host: process.env.SERVER_HOST || "localhost",
    port: process.env.SERVER_PORT || "3002",
};
console.info(serverConfig);

export const subchainConfig = {
    wasmFile: process.env.SUBCHAIN_WASM || "../../build/eden-micro-chain.wasm",
    stateFile: process.env.SUBCHAIN_STATE || "state",
    jsonTrxFile:
        process.env.SUBCHAIN_DFUSE_JSON_TRX_FILE || "dfuse-transactions.json",
};
console.info(subchainConfig);

export const dfuseConfig = {
    apiKey: process.env.DFUSE_API_KEY || "",
    apiNetwork: process.env.DFUSE_API_NETWORK || "eos.dfuse.eosnation.io",
    authNetwork: process.env.DFUSE_AUTH_NETWORK || "https://auth.eosnation.io",
    firstBlock: +process.env.DFUSE_FIRST_BLOCK || 1,
};
console.info({ ...dfuseConfig, apiKey: "<secret>" });

logger.info("<== Env Configs Loaded!");
