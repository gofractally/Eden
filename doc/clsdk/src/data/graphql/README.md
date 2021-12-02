# GraphQL

clsdk comes with the blocks-to-browser (btb) system. btb includes a library that supports running GraphQL queries within WASM. This chapter introduces GraphQL support separate from the rest of the btb system by running GraphQL within contracts. It doesn't use the new action-return-value system introduced with nodeos 2.1. Instead, it uses contract prints for compatibility with nodeos 2.0.
