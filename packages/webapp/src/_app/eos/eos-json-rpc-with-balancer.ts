import { JsonRpc } from "eosjs/dist/eosjs-jsonrpc";

const LOCKING_MESSAGES = [
    "many requests",
    "failed to fetch",
    "unexpected token",
];

export class EosJsonRpcWithBalancer extends JsonRpc {
    private endpoints: string[];
    private balancerIndex: number;

    constructor(
        endpoints: string[],
        args: {
            fetch?: (input?: any, init?: any) => Promise<any>;
        } = {}
    ) {
        super("", args);

        // Removes trailing `/` for the given endpoints
        this.endpoints = endpoints.map((endpoint) =>
            endpoint.replace(/\/$/, "")
        );

        // Init with a Random Balancer
        this.balancerIndex = Math.floor(Math.random() * this.endpoints.length);
    }

    public async fetch(path: string, body: any): Promise<any> {
        let attempts = 0;
        while (attempts < this.endpoints.length) {
            attempts++;
            const currentBalancerIndex = this.balancerIndex;
            try {
                this.endpoint = this.endpoints[currentBalancerIndex];
                return await super.fetch(path, body);
            } catch (error) {
                this.processLockedError(error as Error, currentBalancerIndex);
            }
        }

        throw new Error("Fail to fetch EOS RPC: attempts were exceeded");
    }

    processLockedError(error: Error, currentBalancerIndex: number) {
        console.error("eosrpc balancer processing error:", error);
        const message = error.message.toLowerCase();
        const isLocked = LOCKING_MESSAGES.some((retryable) =>
            message.includes(retryable)
        );
        if (isLocked) {
            this.rotateEndpoint(currentBalancerIndex);
        } else {
            throw error;
        }
    }

    /**
     * Advance and rotate the balancer index. The current index must be passed
     * to avoid concurrent rotations, eg: simultaneous fetches are submitted to
     * the RPC and both fail due too many request, only the first failure should
     * advance the balancer index.
     */
    private rotateEndpoint(currentBalancerIndex: number) {
        if (currentBalancerIndex !== this.balancerIndex) {
            return; // the balancer was already rotated, ignore rotation request
        }
        this.balancerIndex = (this.balancerIndex + 1) % this.endpoints.length;
    }
}
