export class EdenSubchain {
    module?: WebAssembly.Module;
    instance?: WebAssembly.Instance;
    memory?: WebAssembly.Memory;
    exports: any;
    consoleBuf = "";
    initialized = false;
    corrupt = false;

    uint8Array(pos?: number, len?: number) {
        if (this.corrupt) throw new Error("wasm state is corrupt");
        return new Uint8Array(this.memory!.buffer, pos, len);
    }

    decodeStr(pos?: number, len?: number) {
        return new TextDecoder().decode(this.uint8Array(pos, len));
    }

    resultAsUint8Array() {
        return this.uint8Array(
            this.exports.getResult(),
            this.exports.getResultSize()
        );
    }

    resultAsString() {
        return this.decodeStr(
            this.exports.getResult(),
            this.exports.getResultSize()
        );
    }

    imports = {
        clchain: {
            abort_message: (pos: number, len: number) => {
                throw new Error("abort: " + this.decodeStr(pos, len));
            },
            console: (pos: number, len: number) => {
                const s = this.consoleBuf + this.decodeStr(pos, len);
                const l = s.split("\n");
                for (let i = 0; i < l.length - 1; ++i) console.log(l[i]);
                this.consoleBuf = l[l.length - 1];
            },
        },
    };

    async instantiate(module: BufferSource) {
        const result = await WebAssembly.instantiate(module, this.imports);
        this.module = result.module;
        this.instance = result.instance;
        this.exports = result.instance.exports;
        this.memory = this.exports.memory;
        return this;
    }

    async instantiateStreaming(response: Response | PromiseLike<Response>) {
        const result = await WebAssembly.instantiateStreaming(
            response,
            this.imports
        );
        this.module = result.module;
        this.instance = result.instance;
        this.exports = result.instance.exports;
        this.memory = this.exports.memory;
        return this;
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
        if (this.initialized)
            throw new Error("wasm memory is already initialized");
        this.protect(() => {
            this.exports.initialize();
            this.initialized = true;
        });
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
            const block = new Uint8Array(this.resultAsUint8Array());
            const num = new Uint32Array(block.buffer, 32, 8)[0];
            return { block, num };
        });
    }

    undo(blockId: string) {
        // TODO
    }
} // WrapWasm
