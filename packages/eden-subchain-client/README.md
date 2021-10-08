# EdenOS Subchain Client

## Overview

The Eden webapp uses a subchain to track history. This subchain contains a subset of eosio blocks relevant to the Eden contract's history. `eden-micro-chain.wasm`, which runs in both nodejs and in browsers, produces and consumes this subchain. It answers GraphQL queries about the contract history. Here's a typical setup:

### Box server maintains the chain
```
+--------+    +----------+    +------+    +----------+    +-----------+
| dfuse  | => | Relevant | => | wasm | => | subchain | => | websocket |
| client |    | History  |    |      |    | blocks   |    |           |
+--------+    +----------+    |      |    +----------+    +-----------+
                              |      |    +----------+    +-----------+
                              |      | => | current  | => | http GET  |
                              |      |    | state    |    |           |
                              +------+    +----------+    +-----------+
```

### nodejs and web clients consume the chain
```
+-----------+    +----------+    +------+    +----------+    +--------+
| websocket | => | subchain | => | wasm | <= | GraphQL  | <= | client |
|           |    | blocks   |    |      |    | Query    |    | code   |
+-----------+    +----------+    |      |    +----------+    |        |
+-----------+    +----------+    |      |    +----------+    |        |
| http GET  | => | initial  | => |      | => | GraphQL  | => |        |
|           |    | state    |    |      |    | Response |    |        |
+-----------+    +----------+    +------+    +----------+    +--------+
```

When a client starts up, it fetches a copy of `eden-micro-chain.wasm` and a copy of the most-recent state from the Box server. It then subscribes to block updates through a websocket connection.

https://genesis.eden.eoscommunity.org/ uses https://box.prod.eoscommunity.org . Third parties may host apps which use https://box.prod.eoscommunity.org to gain access to Eden history.

Third parties may also host their own box server instances. The box server sources live at https://github.com/eoscommunity/Eden/tree/main/packages/box . The box container is available as `ghcr.io/eoscommunity/eden-box:<git commit>`, https://github.com/eoscommunity/Eden/pkgs/container/eden-box .

## Quick-start guides

[Nodejs Quickstart](docs/nodejs_quickstart.md)

[React Quickstart](docs/react_quickstart.md)
