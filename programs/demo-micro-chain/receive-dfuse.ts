import {
    createDfuseClient,
    GraphqlStreamMessage,
    Stream,
    waitFor,
} from "@dfuse/client";
import { readFileSync, writeFileSync } from "fs";
import { IncomingMessage } from "http";
import nodeFetch from "node-fetch";
import WebSocketClient from "ws";

// TODO: move constants to config.ts

const jsonTrxFile =
    process.env.DFUSE_JSON_TRX_FILE || "dfuse-transactions.json";

const dfuseApiKey = process.env.DFUSE_API_KEY || "";
const dfuseApiNetwork =
    process.env.DFUSE_API_NETWORK || "eos.dfuse.eosnation.io";
const dfuseAuthNetwork = process.env.DFUSE_AUTH_NETWORK || "auth.eosnation.io";

const edenContractAccount =
    process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT || "genesis.eden";
const tokenContractAccount = "eosio.token";
const atomicContractAccount =
    process.env.NEXT_PUBLIC_AA_CONTRACT || "atomicassets";
const atomicMarketContractAccount =
    process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT || "atomicmarket";

const query = `
subscription ($query: String!, $cursor: String, $limit: Int64, $low: Int64, $high: Int64, $irrev: Boolean) {
    searchTransactionsForward(query: $query, lowBlockNum: $low, highBlockNum: $high, limit: $limit, cursor: $cursor, irreversibleOnly: $irrev) {
        undo
        cursor
        irreversibleBlockNum
        trace {
            id
            status
            block {
                num
                id
                timestamp
                previous
            }
            matchingActions {
                seq
                receiver
                account
                name
                hexData
            }
        }
    }
}`;

const queryString = `(
    auth:${edenContractAccount} -action:setcode -action:setabi ||
    receiver:${edenContractAccount} account:${edenContractAccount} ||
    receiver:${edenContractAccount} account:${tokenContractAccount} ||
    receiver:${edenContractAccount} account:${atomicContractAccount} ||
    receiver:${edenContractAccount} account:${atomicMarketContractAccount}
)`;

const variables = {
    query: queryString,
    cursor: "",
    low: 183_349_905,
    limit: 0,
    irrev: false,
};

interface JsonTrx {
    undo: boolean;
    cursor: string;
    trace: any;
}

let jsonTransactions: JsonTrx[] = [];
let numSaved = 0;
try {
    jsonTransactions = JSON.parse(readFileSync(jsonTrxFile, "utf8"));
    numSaved = jsonTransactions.length;
} catch (e) {}

if (jsonTransactions.length)
    variables.cursor = jsonTransactions[jsonTransactions.length - 1].cursor;

async function main(): Promise<void> {
    try {
        const client = createDfuseClient({
            apiKey: dfuseApiKey,
            network: dfuseApiNetwork,
            authUrl: dfuseAuthNetwork,
            httpClientOptions: {
                fetch: nodeFetch,
            },
            graphqlStreamClientOptions: {
                socketOptions: {
                    webSocketFactory: (url) =>
                        webSocketFactory(url, ["graphql-ws"]),
                },
            },
            streamClientOptions: {
                socketOptions: {
                    webSocketFactory,
                },
            },
        });

        const onMessage = (
            message: GraphqlStreamMessage<any>,
            stream: Stream
        ): void => {
            if (message.type === "data") {
                const trx = message.data.searchTransactionsForward;
                console.log(trx.undo, trx.trace.block.num, trx.trace.id);
                jsonTransactions.push(trx);
                if (jsonTransactions.length - numSaved > 10) {
                    console.log("save...", jsonTransactions.length);
                    writeFileSync(
                        jsonTrxFile,
                        JSON.stringify(jsonTransactions)
                    );
                    numSaved = jsonTransactions.length;
                }
                stream.mark({
                    cursor: trx.cursor,
                });
            }
            if (message.type === "error")
                console.error(JSON.stringify(message, null, 4));
        };

        const stream = await client.graphql(query, onMessage, {
            operationType: "subscription",
            variables,
        });

        console.log("Socket is now connected.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function webSocketFactory(
    url: string,
    protocols: string[] = []
): Promise<WebSocketClient> {
    const webSocket = new WebSocketClient(url, protocols, {
        handshakeTimeout: 30 * 1000, // 30s
        maxPayload: 10 * 1024 * 1024,
    });
    return webSocket;
}

main();
