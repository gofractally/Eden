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
import { WrapWasm } from "./wrap-wasm";
import { performance } from "perf_hooks";

// TODO: move constants to config.ts

const jsonTrxFile =
    process.env.DFUSE_JSON_TRX_FILE || "dfuse-transactions.json";

const dfuseApiKey = process.env.DFUSE_API_KEY || "";
const dfuseApiNetwork =
    process.env.DFUSE_API_NETWORK || "eos.dfuse.eosnation.io";
const dfuseAuthNetwork =
    process.env.DFUSE_AUTH_NETWORK || "https://auth.eosnation.io";

const edenContractAccount =
    process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT || "genesis.eden";
const tokenContractAccount = "eosio.token";
const atomicContractAccount =
    process.env.NEXT_PUBLIC_AA_CONTRACT || "atomicassets";
const atomicMarketContractAccount =
    process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT || "atomicmarket";

const query = `
subscription ($query: String!, $cursor: String, $limit: Int64, $low: Int64,
              $high: Int64, $irrev: Boolean, $interval: Uint32) {
    searchTransactionsForward(
                query: $query, lowBlockNum: $low, highBlockNum: $high,
                limit: $limit, cursor: $cursor, irreversibleOnly: $irrev,
                liveMarkerInterval: $interval) {
        undo
        cursor
        irreversibleBlockNum
        block {
            num
            id
            timestamp
            previous
        }
        trace {
            id
            status
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
    interval: 1,
};

interface JsonTrx {
    undo: boolean;
    cursor: string;
    irreversibleBlockNum: number;
    block: {
        num: number;
        id: string;
        timestamp: string;
        previous: string;
    };
    trace: {
        id: string;
        status: string;
        matchingActions: [
            {
                seq: number;
                receiver: string;
                account: string;
                name: string;
                hexData: string;
            }
        ];
    };
}

let jsonTransactions: JsonTrx[] = [];
let numSaved = 0;
try {
    jsonTransactions = JSON.parse(readFileSync(jsonTrxFile, "utf8"));
    numSaved = jsonTransactions.length;
} catch (e) {}

if (jsonTransactions.length)
    variables.cursor = jsonTransactions[jsonTransactions.length - 1].cursor;

let wasm: WrapWasm;

let unpushedTransactions: JsonTrx[] = [];
function pushTrx(trx: JsonTrx) {
    if (unpushedTransactions.length) {
        const prev = unpushedTransactions[unpushedTransactions.length - 1];
        if (trx.undo != prev.undo || trx.block.id != prev.block.id) {
            if (prev.undo) wasm.undo(prev.block.id);
            else if (prev.trace) {
                const block = { ...prev.block, transactions: [] };
                for (let t of unpushedTransactions) {
                    block.transactions.push({
                        id: t.trace.id,
                        actions: t.trace.matchingActions.map((a) => ({
                            seq: a.seq,
                            firstReceiver: a.account,
                            receiver: a.receiver,
                            name: a.name,
                            hexData: a.hexData,
                        })),
                    });
                }
                wasm.pushJsonBlock(
                    JSON.stringify(block),
                    prev.irreversibleBlockNum
                );
            }
            unpushedTransactions = [];
        }
    }
    if (trx.trace !== null) unpushedTransactions.push(trx);
}

async function main(): Promise<void> {
    try {
        wasm = new WrapWasm();
        await wasm.instantiate("../../build/demo-micro-chain.wasm");
        wasm.initializeMemory();

        const begin = performance.now();
        console.log("pushing blocks...");
        for (let trx of jsonTransactions) pushTrx(trx);
        console.log(performance.now() - begin, "ms");
        wasm.saveMemory("state");
        console.log("state saved");

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
                const trx: JsonTrx = message.data.searchTransactionsForward;
                const prev =
                    jsonTransactions.length > 0
                        ? jsonTransactions[jsonTransactions.length - 1]
                        : null;
                console.log(
                    trx.undo,
                    trx.block.num,
                    trx.trace ? trx.trace.id : null
                );
                if (trx.trace || (prev && prev.trace)) {
                    jsonTransactions.push(trx);
                    pushTrx(trx);
                    if (jsonTransactions.length - numSaved > 10 || !trx.trace) {
                        console.log("save...", jsonTransactions.length);
                        writeFileSync(
                            jsonTrxFile,
                            JSON.stringify(jsonTransactions)
                        );
                        wasm.saveMemory("state");
                        numSaved = jsonTransactions.length;
                    }
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
