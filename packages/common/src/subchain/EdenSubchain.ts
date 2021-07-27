export class EdenSubchain {
    module?: WebAssembly.Module;
    instance?: WebAssembly.Instance;
    memory?: WebAssembly.Memory;
    exports: any;
    consoleBuf = "";
    initialized = false;
    corrupt = false;
    schema = "";

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

    setMemory(content: ArrayBuffer) {
        if (this.initialized)
            throw new Error("wasm memory is already initialized");
        const u32 = new Uint32Array(content);
        const growth =
            (u32.byteLength - this.memory!.buffer.byteLength) / (64 * 1024);
        if (growth > 0) this.memory!.grow(growth);
        const dest = new Uint32Array(this.memory!.buffer);
        for (let i = 0; i < u32.length; ++i) dest[i] = u32[i];
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

    trimBlocks() {
        this.protect(() => {
            this.exports.trimBlocks();
        });
    }

    undo(blockId: string) {
        // TODO
    }

    getBlock(num: number) {
        return this.protect(() => {
            if (!this.exports.getBlock(num)) return null;
            return this.resultAsUint8Array();
        });
    }

    getSchema() {
        if (!this.schema.length)
            this.schema = this.decodeStr(
                this.exports.getSchema(),
                this.exports.getSchemaSize()
            );
        return this.schema;
    }

    query(q: string) {
        const utf8 = new TextEncoder().encode(q);
        const destAddr = this.exports.allocateMemory(utf8.length);
        if (!destAddr) return "allocateMemory failed";
        const dest = this.uint8Array(destAddr, utf8.length);
        for (let i = 0; i < utf8.length; ++i) dest[i] = utf8[i];
        this.exports.query(destAddr, utf8.length);
        this.exports.freeMemory(destAddr);
        return JSON.parse(this.resultAsString());
    }
} // WrapWasm
