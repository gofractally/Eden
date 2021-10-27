import { Serialize } from "eosjs";

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
        const result = await (async () => {
            if (WebAssembly.instantiateStreaming) {
                return await WebAssembly.instantiateStreaming(
                    response,
                    this.imports
                );
            } else {
                console.log("instantiateStreaming missing; using fallback");
                const module = await WebAssembly.compile(
                    await (await Promise.resolve(response)).arrayBuffer()
                );
                const instance = await WebAssembly.instantiate(
                    module,
                    this.imports
                );
                return {
                    module,
                    instance,
                };
            }
        })();
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

    initializeMemory(
        edenAccount: string,
        tokenAccount: string,
        atomicAccount: string,
        atomicmarketAccount: string
    ) {
        if (this.initialized)
            throw new Error("wasm memory is already initialized");
        const buf = new Serialize.SerialBuffer();
        buf.pushName(edenAccount);
        buf.pushName(tokenAccount);
        buf.pushName(atomicAccount);
        buf.pushName(atomicmarketAccount);
        const edenAccountLow = buf.getUint32();
        const edenAccountHigh = buf.getUint32();
        const tokenAccountLow = buf.getUint32();
        const tokenAccountHigh = buf.getUint32();
        const atomicAccountLow = buf.getUint32();
        const atomicAccountHigh = buf.getUint32();
        const atomicmarketAccountLow = buf.getUint32();
        const atomicmarketAccountHigh = buf.getUint32();
        this.protect(() => {
            this.exports.initialize(
                edenAccountLow,
                edenAccountHigh,
                tokenAccountLow,
                tokenAccountHigh,
                atomicAccountLow,
                atomicAccountHigh,
                atomicmarketAccountLow,
                atomicmarketAccountHigh
            );
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

    setIrreversible(eosioIrreversible: number): number {
        return this.protect(() => {
            return this.exports.setIrreversible(eosioIrreversible);
        });
    }

    withData<T>(data: Uint8Array, f: (addr: number) => T) {
        const destAddr = this.exports.allocateMemory(data.length);
        if (!destAddr) throw new Error("allocateMemory failed");
        const dest = this.uint8Array(destAddr, data.length);
        for (let i = 0; i < data.length; ++i) dest[i] = data[i];
        const result = f(destAddr);
        this.exports.freeMemory(destAddr);
        return result;
    }

    pushJsonBlock(jsonBlock: string, eosioIrreversible: number) {
        return this.protect(() => {
            const utf8 = new TextEncoder().encode(jsonBlock);
            const ok = !this.withData(utf8, (addr) =>
                this.exports.addEosioBlockJson(
                    addr,
                    utf8.length,
                    eosioIrreversible
                )
            );
            if (!ok) return null;
            const block = new Uint8Array(this.resultAsUint8Array());
            const num = new Uint32Array(block.buffer, 32, 8)[0];
            return { block, num };
        });
    }

    pushBlock(block: Uint8Array, eosioIrreversible: number): boolean {
        return this.protect(() => {
            return this.withData(block, (addr) => {
                return this.exports.addBlock(
                    addr,
                    block.length,
                    eosioIrreversible
                );
            });
        });
    }

    pushShipMessage(message: Uint8Array): boolean {
        return this.protect(() => {
            return this.withData(message, (addr) => {
                return this.exports.pushShipMessage(addr, message.length);
            });
        });
    }

    trimBlocks() {
        this.protect(() => {
            this.exports.trimBlocks();
        });
    }

    undoBlockNum(blockNum: number) {
        this.protect(() => {
            this.exports.undoBlockNum(blockNum);
        });
    }

    undoEosioNum(eosioNum: number) {
        this.protect(() => {
            this.exports.undoEosioNum(eosioNum);
        });
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
        return this.protect(() => {
            return this.withData(utf8, (addr) => {
                this.exports.query(addr, utf8.length, 0, 0);
                return JSON.parse(this.resultAsString());
            });
        });
    }

    getIrreversible(): number {
        const q = this.query(`{
            blockLog{
                irreversible{
                    num
                }
            }
        }`);
        return q.data.blockLog.irreversible?.num || 0;
    }
} // WrapWasm
