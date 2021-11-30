import { Api } from "eosjs/dist/eosjs-api";

import { serverPaysConfig } from "../config";

export const initializeServerPaysNoopAbi = (eosApi: Api) => {
    if (!serverPaysConfig.serverPaysCreateABI) {
        return;
    }

    const noopAbi = {
        version: "eosio::abi/1.1",
        types: [] as any[],
        structs: [
            {
                name: serverPaysConfig.serverPaysNoopAction,
                base: "",
                fields: [] as any[],
            },
        ],
        actions: [
            {
                name: serverPaysConfig.serverPaysNoopAction,
                type: serverPaysConfig.serverPaysNoopAction,
                ricardian_contract: "",
            },
        ],
        tables: [] as any[],
        ricardian_clauses: [] as any[],
        error_messages: [] as any[],
        abi_extensions: [] as any[],
        variants: [] as any[],
    };

    eosApi.cachedAbis.set(serverPaysConfig.serverPaysNoopContract, {
        rawAbi: eosApi.jsonToRawAbi(noopAbi),
        abi: noopAbi,
    });
};
