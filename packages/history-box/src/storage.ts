import { EdenSubchain } from "@edenos/common/dist/subchain";
import * as config from "./config";
import * as fs from "fs";

export class Storage {
    blocksWasm: EdenSubchain;
    stateWasm: EdenSubchain;
    head = 0;
    callbacks: (() => void)[] = [];

    async instantiate() {
        try {
            this.blocksWasm = new EdenSubchain();
            await this.blocksWasm.instantiate(
                new Uint8Array(fs.readFileSync(config.wasmFile))
            );
            this.blocksWasm.initializeMemory();

            this.stateWasm = new EdenSubchain();
            await this.stateWasm.instantiate(
                new Uint8Array(fs.readFileSync(config.wasmFile))
            );
            this.stateWasm.initializeMemory();
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
                config.stateFile + ".tmp",
                this.stateWasm.uint8Array()
            );
            fs.renameSync(config.stateFile + ".tmp", config.stateFile);
            console.log("saved", config.stateFile);
        });
    }

    query(q: string): any {
        return this.protect(() => {
            return this.blocksWasm.query(q);
        });
    }

    getBlock(num: number): Uint8Array {
        return this.protect(() => this.blocksWasm.getBlock(num));
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
                console.error(e);
            }
        }
    }

    undo(id: string) {
        // TODO
    }

    pushJsonBlock(jsonBlock: string, irreversible: number) {
        const result = this.protect(() => {
            const result = this.blocksWasm.pushJsonBlock(
                jsonBlock,
                irreversible
            );
            this.stateWasm.pushJsonBlock(jsonBlock, irreversible);
            this.stateWasm.trimBlocks();
            return result;
        });
        this.changed();
        return result;
    }
}
