import { createDfuseClient, GraphqlStreamMessage, Stream } from "@dfuse/client";
import * as fs from "fs";
import nodeFetch from "node-fetch";
import WebSocketClient from "ws";
import { performance } from "perf_hooks";
import { dfuseConfig, subchainConfig } from "./config";
import { Storage } from "./subchain-storage";
import logger from "./logger";

const query = `
subscription ($query: String!, $cursor: String, $limit: Int64, $low: Int64,
              $high: Int64, $irrev: Boolean, $interval: Uint32, $eden: String) {
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
                dbOps(code: $eden) {
                    key {
                        code
                        table
                        scope
                        key
                    }
                    oldData
                    newData
                }
            }
        }
    }
}`;

interface DbOp {
    key: {
        code: string;
        table: string;
        scope: string;
        key: string;
    };
    oldData: string | null;
    newData: string | null;
}

interface Delta {
    code: string;
    table: string;
    scope: string;
    key: string;
    newData: string;
}

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
                dbOps: [DbOp];
            }
        ];
    };
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

export default class DfuseReceiver {
    storage: Storage;
    jsonTransactions: JsonTrx[] = [];
    unpushedTransactions: JsonTrx[] = [];
    numSaved = 0;

    queryString = `(
        auth:${subchainConfig.eden} -action:setcode -action:setabi ||
        receiver:${subchainConfig.eden} account:${subchainConfig.eden} ||
        receiver:${subchainConfig.eden} account:${subchainConfig.token} ||
        receiver:${subchainConfig.eden} account:${subchainConfig.atomic} ||
        receiver:${subchainConfig.eden} account:${subchainConfig.atomicMarket}
    )`;

    variables = {
        query: this.queryString,
        cursor: "",
        low: dfuseConfig.firstBlock,
        limit: 0,
        irrev: false,
        interval: 30,
        eden: subchainConfig.eden,
    };

    dfuseClient = createDfuseClient({
        apiKey: dfuseConfig.apiKey,
        network: dfuseConfig.apiNetwork,
        authUrl: dfuseConfig.authNetwork,
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

    constructor(storage: Storage) {
        this.storage = storage;
    }

    pushTrx(trx: JsonTrx) {
        if (this.unpushedTransactions.length) {
            const prev = this.unpushedTransactions[
                this.unpushedTransactions.length - 1
            ];
            if (trx.undo != prev.undo || trx.block.id != prev.block.id) {
                if (prev.undo) this.storage.undoEosioNum(prev.block.num);
                else if (prev.trace) {
                    const opMap = new Map<string, DbOp>();
                    const block = {
                        ...prev.block,
                        transactions: [] as any[],
                        deltas: [] as Delta[],
                    };
                    for (let t of this.unpushedTransactions) {
                        for (let act of t.trace.matchingActions) {
                            for (let op of act.dbOps) {
                                const strKey =
                                    op.key.code +
                                    " " +
                                    op.key.table +
                                    " " +
                                    op.key.scope +
                                    " " +
                                    op.key.key;
                                const delta = opMap.get(strKey);
                                if (delta) delta.newData = op.newData;
                                else opMap.set(strKey, op);
                            }
                        }
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
                    const strKeys = Array.from(opMap.keys()).sort();
                    for (let strKey of strKeys) {
                        const op = opMap.get(strKey);
                        if (op.newData !== op.oldData)
                            block.deltas.push({
                                code: op.key.code,
                                table: op.key.table,
                                scope: op.key.scope,
                                key: op.key.key,
                                newData: op.newData,
                            });
                    }
                    this.storage.pushJsonBlock(
                        JSON.stringify(block),
                        prev.irreversibleBlockNum
                    );
                }
                this.unpushedTransactions = [];
            }
        }
        if (trx.trace !== null) this.unpushedTransactions.push(trx);
    }

    onMessage(message: GraphqlStreamMessage<any>, stream: Stream): void {
        if (message.type === "data") {
            const trx: JsonTrx = message.data.searchTransactionsForward;
            const prev =
                this.jsonTransactions.length > 0
                    ? this.jsonTransactions[this.jsonTransactions.length - 1]
                    : null;
            logger.info(
                `${trx.undo ? "undo block" : "recv block"} ${trx.block.num} ${
                    trx.trace
                        ? "trx " + trx.trace.id
                        : "no matching transactions"
                }`
            );
            if (trx.trace || (prev && prev.trace)) {
                this.jsonTransactions.push(trx);
                this.pushTrx(trx);
                if (
                    this.jsonTransactions.length - this.numSaved > 10 ||
                    !trx.trace
                ) {
                    logger.info(
                        `save ${dfuseConfig.jsonTrxFile}: ${this.jsonTransactions.length} transactions and undo entries`
                    );
                    fs.writeFileSync(
                        dfuseConfig.jsonTrxFile + ".tmp",
                        JSON.stringify(this.jsonTransactions)
                    );
                    fs.renameSync(
                        dfuseConfig.jsonTrxFile + ".tmp",
                        dfuseConfig.jsonTrxFile
                    );
                    this.storage.saveState();
                    this.numSaved = this.jsonTransactions.length;
                }
            }
            stream.mark({
                cursor: trx.cursor,
            });
        }
        if (message.type === "error")
            logger.error(JSON.stringify(message, null, 4));
    }

    async start() {
        try {
            try {
                this.jsonTransactions = JSON.parse(
                    fs.readFileSync(dfuseConfig.jsonTrxFile, "utf8")
                );
                this.numSaved = this.jsonTransactions.length;
            } catch (e) {}

            if (this.jsonTransactions.length)
                this.variables.cursor = this.jsonTransactions[
                    this.jsonTransactions.length - 1
                ].cursor;

            const begin = performance.now();
            logger.info("pushing existing blocks...");
            for (let trx of this.jsonTransactions) this.pushTrx(trx);
            logger.info(`${performance.now() - begin} ms`);
            this.storage.saveState();

            if (dfuseConfig.preventConnect) return;

            logger.info("connecting to", dfuseConfig.apiNetwork);
            if (!this.jsonTransactions.length && dfuseConfig.firstBlock === 1)
                logger.warn(
                    "Don't have an existing dfuse cursor and DFUSE_FIRST_BLOCK isn't greater than 1; " +
                        "this may take a while before the first result comes..."
                );

            const stream = await this.dfuseClient.graphql(
                query,
                this.onMessage.bind(this),
                {
                    operationType: "subscription",
                    variables: this.variables,
                }
            );

            logger.info("dfuse is now connected");
        } catch (e: any) {
            logger.error(e);
            process.exit(1);
        }
    } // start()
}
