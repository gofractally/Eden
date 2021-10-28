import WebSocket from "ws";

import { Storage } from "../subchain-storage";
import logger from "../logger";

const SHIP_ADDRESS = "localhost";
const SHIP_PORT = "8080";

export class ShipReceiver {
    storage: Storage;
    wsClient: WebSocket | undefined;
    requestedBlocks = false;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    async start() {
        await this.connect();
    }

    async connect() {
        if (this.wsClient) {
            logger.info(`already connected`);
            return;
        }

        try {
            logger.info(
                `Connecting to SHiP on ${SHIP_ADDRESS}:${SHIP_PORT}...`
            );
            this.wsClient = new WebSocket(`ws://${SHIP_ADDRESS}:${SHIP_PORT}`);
            this.wsClient.on("open", () => {
                logger.info("SHiP is now connected");
            });
            this.wsClient.on("message", (data) => this.onMessage(data));
            this.wsClient.on("close", (reason) => this.disconnect(reason));
            this.wsClient.on("error", (error) => this.disconnect(error));
        } catch (e: any) {
            logger.error(e);
            logger.info("scheduling retry in 10 min");
            setTimeout(() => {
                this.connect();
            }, 10 * 60 * 1000);
        }
    }

    disconnect(reason: any) {
        logger.info("closed connection: %s", reason);
        if (this.wsClient) {
            this.requestedBlocks = false;
            this.wsClient = undefined;
        }
        setTimeout(() => {
            this.connect();
        }, 1000);
    }

    onMessage(data: WebSocket.Data) {
        if (!this.requestedBlocks) {
            logger.info("Requesting Blocks from SHiP...");
            const request = this.storage.getShipBlocksRequest();
            this.requestedBlocks = true;
            this.wsClient!.send(request);
            logger.info("Requested Blocks from SHiP!");
        } else {
            const bytes = (data as ArrayBuffer) as Uint8Array;
            logger.info("shipping %s bytes", bytes.length);
            this.storage.pushShipMessage(bytes);
        }
    }
}
