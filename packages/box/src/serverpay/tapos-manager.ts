import { reverseHex } from "../utility";
import logger from "../logger";
import { rpcEndpoint } from "../config";

interface Tapos {
    ref_block_num: number;
    ref_block_prefix: number;
}

/**
 * Tapos Optimization: cache tapos so signature requests don't hit RPC
 */
export class TaposManager {
    private rpc: any;
    private tapos: Tapos | undefined;

    constructor(rpc: any) {
        this.rpc = rpc;
    }

    init() {
        this.generateTapos();
    }

    getTapos(): Tapos {
        if (!this.tapos) {
            throw new Error(
                "Tapos is not generated yet, please try again later"
            );
        }
        return this.tapos;
    }

    async generateTapos() {
        try {
            const info = await this.rpc.get_info();
            const prefix = parseInt(
                reverseHex(info.last_irreversible_block_id.substr(16, 8)),
                16
            );
            this.tapos = {
                ref_block_num: info.last_irreversible_block_num & 0xffff,
                ref_block_prefix: prefix,
            };
            logger.info(`tapos: ${JSON.stringify(this.tapos)}`);
            setTimeout(
                () => this.generateTapos(),
                rpcEndpoint.taposManagerInterval * 60 * 1000
            );
        } catch (e) {
            logger.error(`generateTapos: ${e.message}`);
            logger.info("retry in 10s");
            setTimeout(() => this.generateTapos(), 10_000);
        }
    }
}
