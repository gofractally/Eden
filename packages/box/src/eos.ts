import * as eosjsJsonRpc from "eosjs/dist/eosjs-jsonrpc";
import * as eosjsApi from "eosjs/dist/eosjs-api";

import { rpcEndpoint } from "./config";

const rpcEndpointUrl = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
export const eosJsonRpc = new eosjsJsonRpc.JsonRpc(rpcEndpointUrl, {
    fetch: require("node-fetch"),
});

export const eosDefaultApi = new eosjsApi.Api({
    rpc: eosJsonRpc,
    signatureProvider: {
        getAvailableKeys: async () => [],
        sign: async (args: any) => {
            throw new Error("implement");
        },
    },
});
