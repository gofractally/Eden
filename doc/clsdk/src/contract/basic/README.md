# Basic Contract

Here is a basic contract definition. Place `example.cpp` and `CMakeLists.txt` in an empty folder.

## `example.cpp`

```cpp
{{#include example.cpp}}
```

## `CMakeLists.txt`

```
{{#include CMakeLists.txt}}
```

## Building

This will create `example.wasm` and `example.abi`:

```sh
mkdir build
cd build
cmake `clsdk-cmake-args` ..
make -j $(nproc)
```

## Trying the contract

clsdk comes with nodeos, cleos, and keosd. The following will execute the contract:

```
# Start keosd on an empty directory
killall keosd
rm -rf testing-wallet testing-wallet-password
mkdir testing-wallet
keosd --wallet-dir `pwd`/testing-wallet --unlock-timeout 99999999 >keosd.log 2>&1 &

# Create a default wallet. This saves the password in testing-wallet-password
cleos wallet create -f testing-wallet-password

# Add the default development key
cleos wallet import --private-key 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3

# Start up a fresh chain
killall nodeos
rm -rf data config
nodeos -d data --config-dir config --plugin eosio::chain_api_plugin --plugin eosio::producer_api_plugin -e -p eosio >nodeos.log 2>&1 &

# Install the contract
cleos create account eosio example EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
cleos set abi example example.abi
cleos set code example example.wasm

# Try out the contract (does nothing)
cleos push action example buydog '["eosio", "fido", "100.0000 EOS"]' -p eosio
```

## vscode support

The following files configure vscode:
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)

Code completion and symbol lookup does not work until the project is built (above).
