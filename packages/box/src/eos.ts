import * as eosjsJsonRpc from "eosjs/dist/eosjs-jsonrpc";
import * as eosjsApi from "eosjs/dist/eosjs-api";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";
import { AuthorityProviderArgs } from "eosjs/dist/eosjs-api-interfaces";

import { rpcEndpoint, sessionsConfig } from "./config";

const rpcEndpointUrl = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
export const eosJsonRpc = new eosjsJsonRpc.JsonRpc(rpcEndpointUrl, {
    fetch: require("node-fetch"),
});

const signatureProvider = new JsSignatureProvider([
    sessionsConfig.sessionSignerPrivateKey,
]);

const authorityProvider = {
    // Optimization: don't need /v1/chain/get_required_keys
    async getRequiredKeys(args: AuthorityProviderArgs) {
        return signatureProvider.getAvailableKeys();
    },
};

export const eosDefaultApi = new eosjsApi.Api({
    rpc: eosJsonRpc,
    signatureProvider,
    authorityProvider,
    chainId: rpcEndpoint.chainId,
});
