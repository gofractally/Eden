# Debugging

This contract is identical to the one in [Notifications](../notify/index.html), except it extends `CMakeLists.txt` to build `notify-debug.wasm` and it has an additional config file (`launch.json`).

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
