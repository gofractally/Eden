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

    uint8ArrayResult() {
        return this.uint8Array(
            this.exports.getResult(),
            this.exports.getResultSize()
        );
    }

    async instantiate(filename = "demo-micro-chain.wasm") {
        const imports = {
            clchain: {
                abort_message: (pos, len) => {
                    throw new Error("abort: " + this.decodeStr(pos, len));
                },
                console: (pos, len) => {
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

    protect<T>(f: () => T) {
        if (this.corrupt) throw new Error("wasm state is corrupt");
        try {
            return f();
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

    pushJsonBlock(jsonBlock: string, irreversible: number) {
        return this.protect(() => {
            const utf8 = new TextEncoder().encode(jsonBlock);
            const destAddr = this.exports.allocateMemory(utf8.length);
            if (!destAddr) throw new Error("allocateMemory failed");
            const dest = this.uint8Array(destAddr, utf8.length);
            for (let i = 0; i < utf8.length; ++i) dest[i] = utf8[i];
            const ok = this.exports.addEosioBlockJson(
                destAddr,
                utf8.length,
                irreversible
            );
            this.exports.freeMemory(destAddr);
            if (!ok) return null;
            const block = new Uint8Array(this.uint8ArrayResult());
            const num = new Uint32Array(block.buffer, 32, 8)[0];
            return { block, num };
        });
    }

    undo(blockId: string) {
        // TODO
    }
} // WrapWasm
