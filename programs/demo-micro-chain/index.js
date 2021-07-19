import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import { buildSchema } from 'graphql';

let module, instance, memory;
let schemaText = '';
let consoleBuf = '';

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

async function fetcher(params) {
   console.log(params);
   const utf8 = (new TextEncoder()).encode(params.query);
   const destAddr = instance.exports.allocate_memory(utf8.length);
   if (!destAddr)
      return "allocate_memory failed";
   const dest = new Uint8Array(memory.buffer, destAddr, utf8.length);
   for (let i = 0; i < utf8.length; ++i)
      dest[i] = utf8[i];
   instance.exports.exec_query(destAddr, utf8.length);
   instance.exports.free_memory(destAddr);
   return JSON.parse(decodeStr(instance.exports.get_result(), instance.exports.get_result_size()));
}

const defaultQuery = `# GraphiQL is talking to a WASM running in the browser.
# The WASM is preloaded with state which includes a subset
# of blocks on the EOS blockchain with actions related to
# the genesis.eden contract.

{
   members(first: 10, after: "000000928149AF31") {
     pageInfo {
       hasPreviousPage
       hasNextPage
       startCursor
       endCursor
     }
     edges {
       cursor
       node {
         account
         inviter
         inductionWitnesses
         inductionVideo
         profile {
           name
           img
           social
           bio
           attributions
         }
       }
     }
   }
 }
 `;

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

(async () => {
   try {
      const x = await WebAssembly.instantiateStreaming(fetch('demo-micro-chain.wasm'), imports);
      module = x.module;
      instance = x.instance;
      memory = instance.exports.memory;

      const state = new Uint32Array(await (await fetch('state')).arrayBuffer());
      const growth = (state.buffer.byteLength - memory.buffer.byteLength) / (64 * 1024);
      if (growth > 0)
         memory.grow(growth);
      const dest = new Uint32Array(memory.buffer);
      for (let i = 0; i < state.length; ++i)
         dest[i] = state[i];

      schemaText = decodeStr(instance.exports.get_schema(), instance.exports.get_schema_size());
      // console.log(schemaText);
      ReactDOM.render(
         <GraphiQL {...{ fetcher, defaultQuery, schema: buildSchema(schemaText) }} />,
         document.getElementById('root'),
      );
   } catch (e) {
      console.error(e);
   }
})();
