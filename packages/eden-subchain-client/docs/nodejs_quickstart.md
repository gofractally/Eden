# Nodejs Quickstart

## Minimal Example

This starts up, runs a single query, and exits.

It needs the following NPM packages:
* `@edenos/eden-subchain-client`
* `eosjs` (eden-subchain-client needs it)
* `node-fetch`
* `ws`

```js
const SubchainClient = require('@edenos/eden-subchain-client/dist/SubchainClient.js').default;
const ws = require('ws');

const box = "box.prod.eoscommunity.org/v1/subchain";

(async () => {
    try {
        const fetch = (await import('node-fetch')).default;

        // Start up the client
        const client = new SubchainClient(ws);
        await client.instantiateStreaming({
            wasmResponse: fetch(`https://${box}/eden-micro-chain.wasm`),
            stateResponse: fetch(`https://${box}/state`),
            blocksUrl: `wss://${box}/eden-microchain`,
        });

        // Run a query
        const member = client.subchain.query(`
      {
        members(ge:"dlarimer.gm", le:"dlarimer.gm") {
          edges {
            node {
              account
              participating
              profile {
                name
                social
              }
            }
          }
        }
      }`).data?.members.edges[0]?.node;

        // Show result
        console.log(JSON.stringify(member, null, 4));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
```
## Notes

Keep the client object around after it has started. It will receive blocks over time through its websocket connection. It has automatic retry when the websocket goes down. Don't frequently create new instances; this will waste resources.

The `query` method only throws an exception when something major goes wrong. If this happens then discard the client object and instantiate a new one. Once it throws, it cannot recover.
