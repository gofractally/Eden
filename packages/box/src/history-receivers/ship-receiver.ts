import WebSocket from "ws";
import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";

import { dfuseConfig } from "../config";
import { Storage } from "../subchain-storage";
import logger from "../logger";
import { JsonTrx } from "./interfaces";

const SHIP_ADDRESS = "localhost";
const SHIP_PORT = "8080";
const FIRST_BLOCK = 1;

export class ShipReceiver {
    storage: Storage;
    wsClient: WebSocket | undefined;
    jsonTransactions: JsonTrx[] = [];
    abi: any;
    types: any;
    blocksQueue: any[] = [];

    variables = {
        query: "",
        cursor: "",
        low: FIRST_BLOCK,
        limit: 0,
        irrev: false,
        interval: dfuseConfig.interval,
    };

    constructor(storage: Storage) {
        this.storage = storage;
    }

    async start() {
        // TODO: add state loader
        await this.connect();
    } // start()

    async connect() {
        if (this.wsClient) {
            logger.info(`already connected`);
            return;
        }

        try {
            logger.info(`connecting to ${SHIP_ADDRESS}:${SHIP_PORT}`);

            if (this.jsonTransactions.length)
                this.variables.cursor = this.jsonTransactions[
                    this.jsonTransactions.length - 1
                ].cursor;

            // Connecting to SHiP
            this.wsClient = new WebSocket(`ws://${SHIP_ADDRESS}:${SHIP_PORT}`);
            this.wsClient.on("open", () => {
                logger.info("SHiP is now connected");
            });
            this.wsClient.on("message", (data) => this.onMessage(data));
            this.wsClient.on("close", this.disconnect);
        } catch (e: any) {
            logger.error(e);
            logger.info("scheduling retry in 10 min");
            setTimeout(() => {
                this.connect();
            }, 10 * 60 * 1000);
        }
    }

    onMessage(data: any) {
        if (!this.abi) {
            this.setupAbi(data);
            this.requestStatus();
        } else {
            const [type, response] = this.deserialize("result", data);
            this[type](response);
        }
    }

    disconnect(reason: string) {
        logger.info("closed connection: %s", reason);
        if (this.wsClient) {
            this.abi = undefined;
            this.wsClient = undefined;
        }
        setTimeout(() => {
            this.connect();
        }, 1000);
    }

    setupAbi(data: string) {
        this.abi = JSON.parse(data);
        logger.info("received SHiP abi");
        this.types = eosjsSerialize.getTypesFromAbi(
            eosjsSerialize.createInitialTypes(),
            this.abi
        );
    }

    requestStatus() {
        this.send(["get_status_request_v0", {}]);
    }

    requestBlocks() {
        this.send([
            "get_blocks_request_v0",
            {
                start_block_num: this.variables.low,
                end_block_num: 0xffffffff,
                max_messages_in_flight: 0xffffffff,
                have_positions: [],
                irreversible_only: false,
                fetch_block: true,
                fetch_traces: true,
                fetch_deltas: false,
            },
        ]);
    }

    get_status_result_v0(response: any) {
        logger.info("get status result head: %s", response.head);
        this.requestBlocks();
    }

    get_blocks_result_v0(response: any) {
        logger.info("get status result: %s", response.this_block);
        this.blocksQueue.push(response);
        // this.processBlocks();
    }

    send(request: any) {
        this.wsClient.send(this.serialize("request", request));
    }

    serialize(type: string, value: any) {
        const buffer = new eosjsSerialize.SerialBuffer({
            textEncoder: new TextEncoder(),
            textDecoder: new TextDecoder(),
        });
        eosjsSerialize.getType(this.types, type).serialize(buffer, value);
        return buffer.asUint8Array();
    }

    deserialize(type: string, bytes: Uint8Array) {
        const buffer = new eosjsSerialize.SerialBuffer({
            textEncoder: new TextEncoder(),
            textDecoder: new TextDecoder(),
            array: bytes,
        });
        let result = eosjsSerialize
            .getType(this.types, type)
            .deserialize(
                buffer,
                new eosjsSerialize.SerializerState({ bytesAsUint8Array: true })
            );
        if (buffer.readPos != bytes.length)
            throw new Error("deserialization error: " + type); // todo: remove check
        return result;
    }
}
