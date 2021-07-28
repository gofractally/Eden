import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { Storage } from "./storage";
import DfuseReceiver from "./DfuseReceiver";
import {
    ClientStatus,
    ServerMessage,
} from "../../common/src/subchain/SubchainProtocol";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
    server,
    path: "/eden-microchain",
});
const storage = new Storage();
const dfuseReceiver = new DfuseReceiver(storage);

// TODO: timeout
class ConnectionState {
    ws: WebSocket;
    haveCallback = false;
    status: ClientStatus;

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
        if (this.status.blocks.length)
            return this.status.blocks[this.status.blocks.length - 1].num;
        return 0;
    }

    sendMsg(msg: ServerMessage) {
        this.ws.send(JSON.stringify(msg));
    }

    update() {
        if (!this.ws) return;
        if (this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.ws = null;
            return;
        }
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
            }
            // TODO: trim status.blocks
            if (needHeadUpdate)
                this.sendMsg({ type: "setHead", head: this.head() });
            if (!this.status.maxBlocksToSend)
                this.sendMsg({ type: "sendStatus" });
            else this.addCallback();
        } catch (e) {
            // TODO: report some errors to client
            console.error(e);
            this.ws.close();
            this.ws = null;
        }
    } // update()
} // ConnectionState

wss.on("connection", (ws: WebSocket) => {
    console.log("incoming connection");
    ws.on("message", (message: string) => {
        const wsa = ws as any;
        if (!wsa.connectionState) wsa.connectionState = new ConnectionState(ws);
        const cs: ConnectionState = wsa.connectionState;
        try {
            cs.status = JSON.parse(message);
            cs.update();
        } catch (e) {
            // TODO: report some errors to client
            console.error(e);
            cs.ws = null;
            ws.close();
        }
    });
});

async function start() {
    await storage.instantiate();
    await dfuseReceiver.start();
    server.listen(process.env.PORT || 3002, () => {
        console.log(`Server started on port ${(server.address() as any).port}`);
    });
}
start();
