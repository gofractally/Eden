import { JsonRpc } from "eosjs/dist/eosjs-jsonrpc";
import { Api } from "eosjs/dist/eosjs-api";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";
import React from "react";
import { render } from "react-dom";
import GraphiQL from "graphiql";
import { buildSchema, GraphQLSchema } from "graphql";
import "./node_modules/graphiql/graphiql.min.css";
global.Buffer = require("buffer/").Buffer;

// nodeos RPC endpoint
const rpcUrl =
    window.location.protocol + "//" + window.location.hostname + ":8888";

// This contract runs the graphql queries
const contract = "example";

// user which authorizes queries
const user = "eosio";

// user's private key
const privateKey = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";

// eosjs
let rpc = new JsonRpc(rpcUrl);
let signatureProvider = new JsSignatureProvider([privateKey]);
let api = new Api({ rpc, signatureProvider });

// show status during startup
let statusContent = "";
function log(msg: string) {
    statusContent += msg + "\n";
    render(<pre style={{ padding: 20 }}>{statusContent}</pre>, document.body);
}

// fetch schema using 'graphqlschema' action
let schema: GraphQLSchema | null = null;
async function fetchSchema() {
    const result = (await api.transact(
        {
            actions: [
                {
                    authorization: [{ actor: user, permission: "active" }],
                    account: contract,
                    name: "graphqlschema",
                    data: {},
                },
            ],
        },
        { useLastIrreversible: true, expireSeconds: 2 }
    )) as any;
    const sch = result.processed.action_traces[0].console;
    log("");
    log(sch);
    schema = buildSchema(sch);
}

// run query using 'graphql' action
async function fetcher({ query }: { query: string }) {
    const result = (await api.transact(
        {
            actions: [
                {
                    authorization: [{ actor: user, permission: "active" }],
                    account: contract,
                    name: "graphql",
                    data: { query },
                },
            ],
        },
        { useLastIrreversible: true, expireSeconds: 2 }
    )) as any;
    return JSON.parse(result.processed.action_traces[0].console);
}

// Populate the UI with this example query
const defaultQuery = `# GraphiQL is talking to a contract running in nodeos.
# Press the ▶ button above to run this query.

{
  contract
  animal(name: "fido") {
    name
    type
    owner
    purchase_price
  }
}`;

// Query UI
function Page() {
    return (
        <main style={{ height: "100%" }}>
            <GraphiQL
                {...{
                    fetcher,
                    defaultQuery,
                    schema: schema!,
                }}
            />
        </main>
    );
}

// Startup
(async () => {
    log(`Using RPC: ${rpc.endpoint}`);
    log("Fetching schema...");
    try {
        await fetchSchema();
        render(<Page></Page>, document.body);
    } catch (e) {
        console.log(e);
        log(e.message);
        log("See console for additional details");
    }
})();
