"use strict";

import { readFileSync, writeFileSync } from "fs";

export class WrapWasm {
    module: WebAssembly.Module;
    instance: WebAssembly.Instance;
    memory: WebAssembly.Memory;
    exports: any;
    consoleBuf = "";
    corrupt = false;

    uint8Array(pos, len) {
        return new Uint8Array(this.memory.buffer, pos, len);
    }

    decodeStr(pos, len) {
        return new TextDecoder().decode(this.uint8Array(pos, len));
    }

    async instantiate(filename = "demo-micro-chain.wasm") {
        const self = this;
        const imports = {
            clchain: {
                abort_message(pos, len) {
                    throw new Error("abort: " + this.decodeStr(pos, len));
                },
                console(pos, len) {
                    const s = this.consoleBuf + this.decodeStr(pos, len);
                    const l = s.split("\n");
                    for (let i = 0; i < l.length - 1; ++i) console.log(l[i]);
                    this.consoleBuf = l[l.length - 1];
                },
            },
        };

        const buf = readFileSync(filename);
        const x = await WebAssembly.instantiate(new Uint8Array(buf), imports);
        this.module = x.module;
        this.instance = x.instance;
        this.exports = x.instance.exports;
        this.memory = this.exports.memory;
    }

    protect(f: () => void) {
        if (this.corrupt) throw new Error("wasm state is corrupt");
        try {
            f();
        } catch (e) {
            this.corrupt = true;
            throw e;
        }
    }

    initializeMemory() {
        this.protect(() => {
            this.exports.initialize();
        });
    }

    saveMemory(filename) {
        if (this.corrupt) throw new Error("wasm state is corrupt");
        writeFileSync(filename, new Uint8Array(this.memory.buffer));
    }

    pushJsonBlocks(jsonBlocks: string, irreversible: number) {
        this.protect(() => {
            const utf8 = new TextEncoder().encode(jsonBlocks);
            const destAddr = this.exports.allocate_memory(utf8.length);
            if (!destAddr) throw new Error("allocate_memory failed");
            const dest = this.uint8Array(destAddr, utf8.length);
            for (let i = 0; i < utf8.length; ++i) dest[i] = utf8[i];
            this.exports.add_eosio_blocks_json(
                destAddr,
                utf8.length,
                irreversible
            );
            this.exports.free_memory(destAddr);
        });
    }

    undo(blockId: string) {
        // TODO
    }
} // WrapWasm
