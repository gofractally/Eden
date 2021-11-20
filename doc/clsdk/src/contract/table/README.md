# Tables

Here is a contract that uses a table. Place `table.cpp` and `CMakeLists.txt` in an empty folder.

## `table.cpp`

```cpp
{{#include table.cpp}}
```

## Additional files

* [CMakeLists.txt](CMakeLists.txt)
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)

## Building

This will create `table.wasm` and `table.abi`:

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

# Install the contract
cleos create account eosio table EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
cleos set abi table table.abi
cleos set code table table.wasm

# Try out the contract
cleos push action table buydog '["alice", "fido", "100.0000 EOS"]' -p alice
cleos push action table buydog '["alice", "rex", "120.0000 EOS"]' -p alice
cleos push action table buydog '["bob", "lambo", "70.0000 EOS"]' -p bob

# See the purchased animals
cleos get table table table animal
```
