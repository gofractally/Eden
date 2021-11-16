import { reverseHex } from "../utility";
import logger from "../logger";

interface Tapos {
    ref_block_num: number;
    ref_block_prefix: number;
}

/**
 * Tapos Optimization: cache tapos so signature requests don't hit RPC
 */
export class TaposManager {
    rpc: any;
    tapos: Tapos;
    resolveHaveTapos: () => void;
    haveTapos = new Promise<void>((resolve, reject) => {
        this.resolveHaveTapos = resolve;
    });

    constructor(rpc: any) {
        this.rpc = rpc;
    }

    init() {
        this.generateTapos();
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
            this.resolveHaveTapos();
            setTimeout(this.generateTapos, 30 * 60 * 1000);
        } catch (e) {
            logger.error(`generateTapos: ${e.message}`);
            logger.info("retry in 10s");
            setTimeout(this.generateTapos, 10_000);
        }
    }
}
