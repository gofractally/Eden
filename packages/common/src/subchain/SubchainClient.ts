import { EdenSubchain } from "./EdenSubchain";
import {
    BlockInfo,
    ClientStatus,
    sanitizeServerMessage,
} from "./SubchainProtocol";

export default class SubchainClient {
    subchain = new EdenSubchain();
    shuttingDown = false;
    blocksUrl = "";
    slowmo = false;
    ws: WebSocket | null = null;
    notifications: ((client: SubchainClient) => void)[] = [];

    async instantiateStreaming(
        wasmResponse: PromiseLike<Response>,
        stateResponse: PromiseLike<Response>,
        blocksUrl: string,
        slowmo = false
    ) {
        this.blocksUrl = blocksUrl;
        this.slowmo = slowmo;
        if (this.shuttingDown) return this.shutdown();
        const [, state] = await Promise.all([
            this.subchain.instantiateStreaming(wasmResponse),
            stateResponse.then((resp) => {
                if (resp.ok) return resp.arrayBuffer();
                return null;
            }),
        ]);
        if (this.shuttingDown) return this.shutdown();
        if (state) {
            this.subchain.setMemory(state);
        } else {
            this.subchain.initializeMemory();
        }
        this.connect();
    }

    connect() {
        if (this.shuttingDown) return this.shutdown();
        this.ws = new WebSocket(this.blocksUrl);
        this.ws.onclose = () => {
            console.error("Closed connection to " + this.blocksUrl);
            this.ws = null;
            if (!this.shuttingDown) setTimeout(() => this.connect(), 500);
        };
        this.ws.onerror = () => {
            console.error("Error connecting to " + this.blocksUrl);
            this.ws = null;
        };
        this.ws.onopen = () => {
            console.log("Connected to " + this.blocksUrl);
            if (this.slowmo) {
                setTimeout(() => this.sendStatus(), 1000);
            } else {
                this.sendStatus();
            }
        };
        this.ws.onmessage = (ev: MessageEvent<any>) => this.onmessage(ev);
    }

    async sendStatus() {
        if (this.shuttingDown) return this.shutdown();
        if (!this.ws) return;
        const irreversible: number = this.subchain.getIrreversible();
        const blocks: BlockInfo[] = this.subchain
            .query(
                `{blockLog{blocks(ge:${irreversible}){edges{node{num id}}}}}`
            )
            .data.blockLog.blocks.edges.map((e: any) => e.node);
        const stat: ClientStatus = {
            maxBlocksToSend: this.slowmo ? 1 : 1000,
            irreversible,
            blocks,
        };
        if (this.slowmo)
            setTimeout(() => this.ws?.send(JSON.stringify(stat)), 50);
        else this.ws.send(JSON.stringify(stat));
    }

    messageQueue: (Promise<ArrayBuffer> | string)[] = [];
    processingQueue = false;

    async processQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;
        try {
            while (this.messageQueue.length) {
                if (this.shuttingDown) return this.shutdown();
                const data = this.messageQueue.shift();
                if (data instanceof Promise) {
                    const d = await data;
                    this.subchain.pushBlock(new Uint8Array(d), 0);
                } else {
                    const msg = sanitizeServerMessage(JSON.parse(data!));
                    if (msg.type === "sendStatus") {
                        await this.sendStatus();
                    } else if (msg.type === "setIrreversible") {
                        this.subchain.setIrreversible(msg.irreversible!);
                        this.subchain.trimBlocks();
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
        const n = this.notifications;
        this.notifications = [];
        for (let f of n) f(this);
        this.processingQueue = false;
    }

    async onmessage(ev: MessageEvent<any>) {
        if (this.shuttingDown) return this.shutdown();
        if (ev.data instanceof Blob) {
            this.messageQueue.push(ev.data.arrayBuffer());
            this.processQueue();
        } else if (typeof ev.data === "string") {
            this.messageQueue.push(ev.data);
            this.processQueue();
        }
    }

    shutdown() {
        this.shuttingDown = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
