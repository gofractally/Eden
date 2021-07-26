import {
    createDfuseClient,
    GraphqlStreamMessage,
    Stream,
    waitFor,
} from "@dfuse/client";
import * as fs from "fs";
import { IncomingMessage } from "http";
import nodeFetch from "node-fetch";
import WebSocketClient from "ws";
import { performance } from "perf_hooks";
import * as config from "./config";
import { Storage } from "./storage";

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
    auth:${config.edenContractAccount} -action:setcode -action:setabi ||
    receiver:${config.edenContractAccount} account:${config.edenContractAccount} ||
    receiver:${config.edenContractAccount} account:${config.tokenContractAccount} ||
    receiver:${config.edenContractAccount} account:${config.atomicContractAccount} ||
    receiver:${config.edenContractAccount} account:${config.atomicMarketContractAccount}
)`;

const variables = {
    query: queryString,
    cursor: "",
    low: config.dfuseFirstBlock,
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
    jsonTransactions = JSON.parse(fs.readFileSync(config.jsonTrxFile, "utf8"));
    numSaved = jsonTransactions.length;
} catch (e) {}

if (jsonTransactions.length)
    variables.cursor = jsonTransactions[jsonTransactions.length - 1].cursor;

let storage: Storage;

let unpushedTransactions: JsonTrx[] = [];
function pushTrx(trx: JsonTrx) {
    if (unpushedTransactions.length) {
        const prev = unpushedTransactions[unpushedTransactions.length - 1];
        if (trx.undo != prev.undo || trx.block.id != prev.block.id) {
            if (prev.undo) storage.undo(prev.block.id);
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
                storage.pushJsonBlock(
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
        storage = new Storage();
        await storage.instantiate();
        const begin = performance.now();
        console.log("pushing existing blocks...");
        for (let trx of jsonTransactions) pushTrx(trx);
        console.log(performance.now() - begin, "ms");
        storage.saveState();

        console.log("connecting to", config.dfuseApiNetwork);
        if (!jsonTransactions.length && config.dfuseFirstBlock === 1)
            console.warn(
                "Don't have an existing dfuse cursor and DFUSE_FIRST_BLOCK isn't set; this may take a while before the first result comes..."
            );

        const client = createDfuseClient({
            apiKey: config.dfuseApiKey,
            network: config.dfuseApiNetwork,
            authUrl: config.dfuseAuthNetwork,
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
                    trx.undo ? "undo block" : "recv block",
                    trx.block.num,
                    trx.trace
                        ? "trx " + trx.trace.id
                        : "no matching transactions"
                );
                if (trx.trace || (prev && prev.trace)) {
                    jsonTransactions.push(trx);
                    pushTrx(trx);
                    if (jsonTransactions.length - numSaved > 10 || !trx.trace) {
                        console.log(
                            `save ${config.jsonTrxFile}:`,
                            jsonTransactions.length,
                            "transactions and undo entries"
                        );
                        fs.writeFileSync(
                            config.jsonTrxFile + ".tmp",
                            JSON.stringify(jsonTransactions)
                        );
                        fs.renameSync(
                            config.jsonTrxFile + ".tmp",
                            config.jsonTrxFile
                        );
                        storage.saveState();
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
