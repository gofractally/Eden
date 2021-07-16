'use strict';

const fs = require('fs');

(async () => {
   function oops(s) {
      console.error('oops: ', s);
      throw new Error(s);
   }

   function uint8Array(pos, len) {
      return new Uint8Array(instance.exports.memory.buffer, pos, len);
   }

   function decodeStr(pos, len) {
      return (new TextDecoder()).decode(uint8Array(pos, len));
   }

   let module, instance;
   let consoleBuf = '';

   const imports = {
      clchain: {
         abort_message(pos, len) {
            oops('abort: ' + decodeStr(pos, len));
         },

         console(pos, len) {
            const s = consoleBuf + decodeStr(pos, len);
            const l = s.split('\n');
            for (let i = 0; i < l.length - 1; ++i)
               console.log(l[i]);
            consoleBuf = l[l.length - 1];
         },
      },
   };

   try {
      const buf = fs.readFileSync('demo-micro-chain.wasm');
      const x = await WebAssembly.instantiate(new Uint8Array(buf), imports);
      module = x.module;
      instance = x.instance;
      instance.exports.initialize();

      let history = JSON.parse(fs.readFileSync('../x/sample2.json'));
      let blocks = [];
      let block = { transactions: [] };
      for (let x of history) {
         for (let y of x.data.searchTransactionsForward.results) {
            if (y.trace.status !== 'EXECUTED')
               continue;
            if (block.id && block.id !== y.block.id) {
               blocks.push(block);
               block = { transactions: [] };
            }
            block.num = y.block.num;
            block.id = y.block.id;
            block.timestamp = y.block.timestamp;
            block.previous = y.block.previous;
            block.transactions.push({
               id: y.trace.id,
               actions: y.trace.matchingActions.map(a => ({
                  seq: a.seq,
                  firstReceiver: a.account,
                  receiver: a.receiver,
                  name: a.name,
                  hexData: a.hexData,
               })),
            });
         }
      }
      if (block.id)
         blocks.push(block);

      for (let block of blocks) {
         const jsonBlocks = JSON.stringify([block]);
         const utf8 = (new TextEncoder()).encode(jsonBlocks);
         // console.log('utf8 size:', utf8.length);
         const destAddr = instance.exports.allocate_memory(utf8.length);
         if (!destAddr)
            throw new Error("allocate_memory failed");
         const dest = new Uint8Array(instance.exports.memory.buffer, destAddr, utf8.length);
         for (let i = 0; i < utf8.length; ++i)
            dest[i] = utf8[i];
         instance.exports.add_eosio_blocks_json(destAddr, utf8.length, 999999999);
         instance.exports.free_memory(destAddr);
      }

      // const schemaText = decodeStr(instance.exports.get_schema(), instance.exports.get_schema_size());
      // console.log(schemaText);

      fs.writeFileSync('state', new Uint8Array(instance.exports.memory.buffer));
   } catch (e) {
      console.error(e);
   }
})();
