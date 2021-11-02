import { EdenSubchain } from "@edenos/common/dist/subchain";
import * as config from "./config";
import * as fs from "fs";
import logger from "./logger";

export class Storage {
    blocksWasm: EdenSubchain | null = null;
    stateWasm: EdenSubchain | null = null;
    head = 0;
    callbacks: (() => void)[] = [];

    async instantiate(
        edenAccount: string,
        tokenAccount: string,
        atomicAccount: string,
        atomicmarketAccount: string
    ) {
        try {
            this.blocksWasm = new EdenSubchain();
            await this.blocksWasm.instantiate(
                new Uint8Array(fs.readFileSync(config.subchainConfig.wasmFile))
            );
            this.blocksWasm.initializeMemory(
                edenAccount,
                tokenAccount,
                atomicAccount,
                atomicmarketAccount
            );

            this.stateWasm = new EdenSubchain();
            await this.stateWasm.instantiate(
                new Uint8Array(fs.readFileSync(config.subchainConfig.wasmFile))
            );
            this.stateWasm.initializeMemory(
                edenAccount,
                tokenAccount,
                atomicAccount,
                atomicmarketAccount
            );
        } catch (e) {
            this.blocksWasm = null;
            this.stateWasm = null;
            throw e;
        }
    }

    protect<T>(f: () => T) {
        if (!this.blocksWasm || !this.stateWasm)
            throw new Error("wasm state is corrupt");
        try {
            return f();
        } catch (e) {
            this.blocksWasm = null;
            this.stateWasm = null;
            throw e;
        }
    }

    saveState() {
        return this.protect(() => {
            fs.writeFileSync(
                config.subchainConfig.stateFile + ".tmp",
                this.stateWasm!.uint8Array()
            );
            fs.renameSync(
                config.subchainConfig.stateFile + ".tmp",
                config.subchainConfig.stateFile
            );
            logger.info(`saved ${config.subchainConfig.stateFile}`);
        });
    }

    query(q: string): any {
        return this.protect(() => {
            return this.blocksWasm!.query(q);
        });
    }

    getBlock(num: number): Uint8Array {
        return this.protect(() => this.blocksWasm!.getBlock(num))!;
    }

    idForNum(num: number): string {
        return this.query(`{blockLog{blockByNum(num:${num}){id}}}`).data
            .blockLog.blockByNum.id;
    }

    changed() {
        const r = this.query("{blockLog{head{num}}}");
        this.head = r.data.blockLog.head?.num || 0;
        const cb = this.callbacks;
        this.callbacks = [];
        for (let f of cb) {
            try {
                f();
            } catch (e) {
                logger.error(e);
            }
        }
    }

    undoEosioNum(eosioNum: number) {
        this.protect(() => {
            this.blocksWasm!.undoEosioNum(eosioNum);
            this.stateWasm!.undoEosioNum(eosioNum);
        });
        this.changed();
    }

    pushJsonBlock(jsonBlock: string, irreversible: number) {
        const result = this.protect(() => {
            const result = this.blocksWasm!.pushJsonBlock(
                jsonBlock,
                irreversible
            );
            this.stateWasm!.pushJsonBlock(jsonBlock, irreversible);
            this.stateWasm!.trimBlocks();
            return result;
        });
        this.changed();
        return result;
    }

    getShipBlocksRequest(blockNum: number): Uint8Array {
        return this.protect(() =>
            this.blocksWasm!.getShipBlocksRequest(blockNum)
        )!;
    }

    pushShipMessage(shipMessage: Uint8Array) {
        const result = this.protect(() => {
            const result = this.blocksWasm!.pushShipMessage(shipMessage);
            this.stateWasm!.pushShipMessage(shipMessage);
            this.stateWasm!.trimBlocks();
            return result;
        });
        this.changed();
        return result;
    }
}
