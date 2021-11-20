# Debugging using gdb command line

You should have the following project tree:

```
<project root>/
   CMakeLists.txt
   notify.cpp
   build/         (Created by build step)
      clsdk -> ....
      notify-debug.wasm
      notify.abi
      notify.wasm
      wasi-sdk -> ....
```

To start a debug session on the command line:

```
cd build
gdb -q --args                                                           \
   ./clsdk/bin/nodeos                                                   \
   -d data --config-dir config                                          \
   --plugin eosio::chain_api_plugin                                     \
   --plugin eosio::producer_api_plugin                                  \
   --plugin eosio::debug_plugin                                         \
   --subst clsdk/contracts/token.wasm:clsdk/contracts/token-debug.wasm  \
   --subst notify.wasm:notify-debug.wasm                                \
   -e -p eosio
```

Ignore `No debugging symbols found in ...`; it will load debugging symbols for the wasm files instead.

The following gdb commands set options gdb needs to function, set some breakpoints, and start nodeos.

```
handle SIG34 noprint
set breakpoint pending on
set substitute-path clsdk-wasi-sdk: wasi-sdk
set substitute-path clsdk: clsdk
b example_contract::notify_transfer
b example_contract::buydog
run
```

From another terminal, use these commands to install and exercise the contracts. The debugger should hit the breakpoints you set in the contracts and pause.

```
cd build

# Create some users
cleos create account eosio alice EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
cleos create account eosio bob EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV

# Set up eosio.token
# Note: the build system created a symlink to clsdk for easy access to the token contract
cleos create account eosio eosio.token EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
cleos set abi eosio.token clsdk/contracts/token.abi
cleos set code eosio.token clsdk/contracts/token.wasm

cleos push action eosio.token create '["eosio", "1000000000.0000 EOS"]' -p eosio.token
cleos push action eosio.token issue '["eosio", "1000000000.0000 EOS", ""]' -p eosio
cleos push action eosio.token open '["alice", "4,EOS", "alice"]' -p alice
cleos push action eosio.token open '["bob", "4,EOS", "bob"]' -p bob
cleos push action eosio.token transfer '["eosio", "alice", "10000.0000 EOS", "have some"]' -p eosio
cleos push action eosio.token transfer '["eosio", "bob", "10000.0000 EOS", "have some"]' -p eosio

# Install the notify contract
cleos create account eosio notify EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
cleos set abi notify notify.abi
cleos set code notify notify.wasm

# Try out the notify contract; these should trigger breakpoints
cleos push action eosio.token transfer '["alice", "notify", "300.0000 EOS", "for purchases"]' -p alice
cleos push action eosio.token transfer '["bob", "notify", "300.0000 EOS", "for purchases"]' -p bob

cleos push action notify buydog '["alice", "fido", "100.0000 EOS"]' -p alice
cleos push action notify buydog '["alice", "rex", "120.0000 EOS"]' -p alice
cleos push action notify buydog '["bob", "lambo", "70.0000 EOS"]' -p bob

# See the remaining balances and the purchased animals
cleos get table notify notify balance
cleos get table notify notify animal
```

## Debugging functionality

The following functionality is supported:
* breakpoints (`b`)
* step in (`s`)
* step out (`fin`)
* step over (`n`)
* continue (`c`)
* call stack (`bt`)

The following are not available:
* examining variables
* examining memory

## Corrupted database recovery

The debugger can cause nodeos to corrupt its database. There are 2 options to recover from the corruption:

* Wipe the database and start over: from the `build` directory, run `rm -rf data`
* Force a replay. This can trigger breakpoints (helpful for reproductions). From the `build` directory, run `rm -rf data/state data/blocks/reversible`. Alternatively, add `--hard-replay-blockchain` to the nodeos options.

You can start nodeos again in the debugger after doing one of the above.
