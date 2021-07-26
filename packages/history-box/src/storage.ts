import { EdenSubchain } from "@edenos/common/dist/subchain";
import * as config from "./config";
import * as fs from "fs";

export class Storage {
    blocksWasm: EdenSubchain;
    stateWasm: EdenSubchain;

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
            f();
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

    undo(id: string) {
        // TODO
    }

    pushJsonBlock(jsonBlock: string, irreversible: number) {
        return this.protect(() => {
            const result = this.blocksWasm.pushJsonBlock(
                jsonBlock,
                irreversible
            );
            this.stateWasm.pushJsonBlock(jsonBlock, irreversible);
            this.stateWasm.trimBlocks();
            return result;
        });
    }
}
