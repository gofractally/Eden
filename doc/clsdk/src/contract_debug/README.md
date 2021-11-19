# Debugging

This contract is identical to the one in [Notifications](../contract_notify/index.html), except it extends `CMakeLists.txt` to build `notify-debug.wasm` and it has an additional config file (`launch.json`).

## `CMakeLists.txt`

```cpp
{{#include CMakeLists.txt}}
```

## Additional files

* [notify.cpp](notify.cpp)
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)
* [.vscode/launch.json](.vscode/launch.json)

## Building

This will create `notify.wasm`, `notify-debug.wasm`, and `notify.abi`:

```sh
mkdir build
cd build
cmake `clsdk-cmake-args` ..
make -j $(nproc)
```

## Nodeos debug_plugin

debug_plugin (included in the nodeos binary that comes with clsdk) adds these new capabilities to nodeos:

* Wasm substitution (`--subst contract.wasm:debug.wasm`). This instructs nodeos to execute `debug.wasm` whenever it would otherwise execute `contract.wasm`. nodeos identifies wasms by hash, so this affects all accounts which have the same wasm installed.
* Relaxed wasm limits. Debugging wasms are usually much larger than normal contract wasms. debug_plugin removes eosio wasm limits to allow the larger wasms to execute. They are also slower, so it also removes execution time limits.
* Debug info support. It transforms wasm debug info into native debug info. This enables `gdb` to debug executing contracts.

Only substituted wasms get the relaxed limits and debug info support.

Caution: debug_plugin intentionally breaks consensus rules to function; nodes using it may fork away from production chains.

Caution: stopping nodeos from inside the debugger will corrupt its database.

## Debugging using vscode

You should have the following project tree:

```
<project root>/   <==== open this directory in vscode
   .vscode/
      c_cpp_properties.json
      launch.json
      settings.json
   CMakeLists.txt
   notify.cpp
   build/         (Created by build step above)
      clsdk -> ....
      notify-debug.wasm
      notify.abi
      notify.wasm
      wasi-sdk -> ....
```

`launch.json` sets the following nodeos options. Adjust them to your needs:

```
-d data --config-dir config
--plugin eosio::chain_api_plugin
--plugin eosio::producer_api_plugin
--plugin eosio::debug_plugin
--subst clsdk/contracts/token.wasm:clsdk/contracts/token-debug.wasm
--subst notify.wasm:notify-debug.wasm
-e -p eosio
```

Open `notify.cpp` and set some break points. You may also add break points to `build/clsdk/contracts/token/src/token.cpp`.

Start the debugger. nodeos will start running. To see its log, switch to the "cppdbg: nodeos" terminal.

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

# Try out the notify contract
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

The following are available:
* breakpoints
* step in
* step out
* step over
* continue
* call stack

The following are not available
* examining variables
* examining memory

## Corrupted database recovery

The debugger can cause nodeos to corrupt its database. There are 2 options to recover from the corruption:

* Wipe the database and start over: from the `build` directory, run `rm -rf data`
* Force a replay. Note that this can trigger breakpoints (helpful for reproductions). From the `build` directory, run `rm -rf data/state data/blocks/reversible`. Alternatively, add `--hard-replay-blockchain` to the nodeos options in `launch.json`.

You can start nodeos again in the debugger after doing one of the above.
