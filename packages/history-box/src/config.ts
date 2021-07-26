export const wasmFile =
    process.env.EDEN_SUBCHAIN_WASM || "../../build/demo-micro-chain.wasm";
export const stateFile = process.env.EDEN_SUBCHAIN_STATE || "state";
export const jsonTrxFile =
    process.env.DFUSE_JSON_TRX_FILE || "dfuse-transactions.json";

export const dfuseApiKey = process.env.DFUSE_API_KEY || "";
export const dfuseApiNetwork =
    process.env.DFUSE_API_NETWORK || "eos.dfuse.eosnation.io";
export const dfuseAuthNetwork =
    process.env.DFUSE_AUTH_NETWORK || "https://auth.eosnation.io";
export const dfuseFirstBlock = +process.env.DFUSE_FIRST_BLOCK || 1;

export const edenContractAccount = process.env.EDEN_CONTRACT || "genesis.eden";
export const tokenContractAccount = "eosio.token";
export const atomicContractAccount = process.env.AA_CONTRACT || "atomicassets";
export const atomicMarketContractAccount =
    process.env.AA_MARKET_CONTRACT || "atomicmarket";
