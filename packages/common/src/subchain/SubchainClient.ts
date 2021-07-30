import EdenSubchain from "./EdenSubchain";
import {
    BlockInfo,
    ClientStatus,
    sanitizeServerMessage,
} from "./SubchainProtocol";

export default class SubchainClient {
    subchain = new EdenSubchain();
    shuttingDown = false;
    ws: WebSocket | null = null;
    notifications: ((client: SubchainClient) => void)[] = [];

    async instantiateStreaming(
        response: Response | PromiseLike<Response>,
        blocksUrl: string
    ) {
        if (this.shuttingDown) return this.shutdown();
        await this.subchain.instantiateStreaming(response);
        if (this.shuttingDown) return this.shutdown();
        this.subchain.initializeMemory();
        this.ws = new WebSocket(blocksUrl);
        this.ws.onclose = () => {
            console.error("Sever closed connection to " + blocksUrl);
            this.ws = null;
        };
        this.ws.onerror = () => {
            console.error("Error connecting to " + blocksUrl);
            this.ws = null;
        };
        this.ws.onopen = () => {
            console.log("Connected to " + blocksUrl);
            this.sendStatus();
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
            maxBlocksToSend: 1000,
            irreversible,
            blocks,
        };
        this.ws.send(JSON.stringify(stat));
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
