# Notifications

This contract adds the following capabilities to the previous examples:
* Receives notifications from `eosio.token` and tracks user balances
* Deducts from the user balance whenever the user buys a dog

This example does not cover:
* Removing empty balance records
* Returning excess funds to users
* Protecting against dust attacks on the balance table
* Treating incoming funds from system accounts as special (e.g. unstaking, selling rex, selling ram)

Place `notify.cpp` and `CMakeLists.txt` in an empty folder.

## `notify.cpp`

```cpp
{{#include notify.cpp}}
```

## Additional files

* [CMakeLists.txt](CMakeLists.txt)
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)

## Building

This will create `notify.wasm` and `notify.abi`:

```sh
mkdir build
cd build
cmake `clsdk-cmake-args` ..
make -j $(nproc)
```

## Trying the contract

```
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

# Install the contract
cleos create account eosio notify EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
cleos set abi notify notify.abi
cleos set code notify notify.wasm

# Try out the contract
cleos push action eosio.token transfer '["alice", "notify", "300.0000 EOS", "for purchases"]' -p alice
cleos push action eosio.token transfer '["bob", "notify", "300.0000 EOS", "for purchases"]' -p bob

cleos push action notify buydog '["alice", "fido", "100.0000 EOS"]' -p alice
cleos push action notify buydog '["alice", "rex", "120.0000 EOS"]' -p alice
cleos push action notify buydog '["bob", "lambo", "70.0000 EOS"]' -p bob

# See the remaining balances and the purchased animals
cleos get table notify notify balance
cleos get table notify notify animal
```
