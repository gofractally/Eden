import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import path from "path";
import { Storage } from "../subchain-storage";
import logger from "../logger";
import { subchainConfig, SubchainReceivers } from "../config";
import { DfuseReceiver, ShipReceiver } from "../history-receivers";
import {
    ClientStatus,
    ServerMessage,
    sanitizeClientStatus,
} from "@edenos/common/dist/subchain/SubchainProtocol";

const storage = new Storage();
export const subchainHandler = express.Router();

subchainHandler.get("/eden-micro-chain.wasm", (req, res) => {
    res.sendFile(path.resolve(subchainConfig.wasmFile));
});

subchainHandler.get("/state", (req, res) => {
    res.sendFile(path.resolve("./state"));
});

subchainHandler.use((req, res, next) => {
    res.status(404).send("404");
});

// TODO: timeout
class ConnectionState {
    ws: WebSocket | null;
    haveCallback = false;
    status: ClientStatus | null = null;

    constructor(ws: WebSocket) {
        this.ws = ws;
    }

    addCallback() {
        if (!this.haveCallback) {
            this.haveCallback = true;
            storage.callbacks.push(() => {
                this.haveCallback = false;
                this.update();
            });
        }
    }

    head() {
        if (this.status?.blocks.length)
            return this.status.blocks[this.status.blocks.length - 1].num;
        return 0;
    }

    sendMsg(msg: ServerMessage) {
        this.ws!.send(JSON.stringify(msg));
    }

    update() {
        if (!this.ws) return;
        if (this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.ws = null;
            return;
        }
        if (!this.status) return;
        try {
            let needHeadUpdate = false;
            while (this.status.blocks.length) {
                const b = this.status.blocks[this.status.blocks.length - 1];
                if (b.num > storage.head || b.id !== storage.idForNum(b.num)) {
                    this.status.blocks.pop();
                    needHeadUpdate = true;
                } else {
                    break;
                }
            }
            while (this.status.maxBlocksToSend > 0) {
                let needBlock = this.head() + 1;
                if (needBlock > storage.head) break;
                const block = storage.getBlock(needBlock);
                if (!block) throw new Error("Missing block");
                this.ws.send(block);
                this.status.maxBlocksToSend--;
                this.status.blocks.push({
                    num: needBlock,
                    id: storage.idForNum(needBlock),
                });
                needHeadUpdate = false;
                let irreversible = Math.min(
                    storage.blocksWasm!.getIrreversible(),
                    this.head()
                );
                if (irreversible > this.status.irreversible) {
                    this.sendMsg({ type: "setIrreversible", irreversible });
                    this.status.irreversible = irreversible;
                }
            }
            // TODO: trim status.blocks
            if (needHeadUpdate)
                this.sendMsg({ type: "setHead", head: this.head() });
            if (!this.status.maxBlocksToSend) {
                this.sendMsg({ type: "sendStatus" });
                this.status = null;
            } else {
                this.addCallback();
            }
        } catch (e) {
            // TODO: report some errors to client
            logger.error(e);
            logger.error("closing incoming websocket");
            this.ws.close();
            this.ws = null;
        }
    } // update()
} // ConnectionState

export function createWSServer(path: string, server: http.Server) {
    const wss = new WebSocket.Server({
        server,
        path: `${path}/eden-microchain`,
    });

    wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
        logger.info(`incoming ws connection, origin: ${req.headers.origin}`);
        ws.on("message", (message: string) => {
            const wsa = ws as any;
            if (!wsa.connectionState)
                wsa.connectionState = new ConnectionState(ws);
            const cs: ConnectionState = wsa.connectionState;
            try {
                cs.status = sanitizeClientStatus(JSON.parse(message));
                cs.update();
            } catch (e) {
                // TODO: report some errors to client
                logger.error(e);
                logger.error("closing incoming websocket");
                cs.ws = null;
                ws.close();
            }
        });
    });
}

export async function startSubchain() {
    try {
        await storage.instantiate(
            subchainConfig.eden,
            subchainConfig.token,
            subchainConfig.atomic,
            subchainConfig.atomicMarket
        );

        await setupReceiver();
    } catch (e: any) {
        logger.error(e);
    }
}

const setupReceiver = async () => {
    switch (subchainConfig.receiver) {
        case SubchainReceivers.DFUSE: {
            const dfuseReceiver = new DfuseReceiver(storage);
            return dfuseReceiver.start();
        }
        case SubchainReceivers.SHIP: {
            const shipReceiver = new ShipReceiver(storage);
            return shipReceiver.start();
        }
    }
};
