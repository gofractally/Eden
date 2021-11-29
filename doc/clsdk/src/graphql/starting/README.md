# GraphQL: Getting Started

## Contract and Test Modifications

This example is based on the [cltester Token Example](../../cltester/token/index.html), but has these changes:

* The contract has two new actions: `graphql` and `graphqlschema`, which are shown below
* `CMakeLists.txt` adds the `btb` and `btb-debug` libraries as dependencies to `example.wasm` and `example-debug.wasm`
* The test case sets up a chain and starts nodeos

The files:

* [example.hpp](example.hpp)
* [example.cpp](example.cpp)
* [example-graphql.cpp](example-graphql.cpp)
* [tests.cpp](tests.cpp)
* [CMakeLists.txt](CMakeLists.txt)
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)

## Simple GraphQL Query

`example-graphql.cpp`:
```cpp
{{#include example-graphql.cpp}}
```

## const

```cpp
std::optional<example::animal> animal(eosio::name name) const
{
   // ...
}
```

Since btb's GraphQL system doesn't support mutation, query methods must be marked `const` as above. It ignores non-const methods.

## Starting the Example

This builds the example and starts nodeos:

```
mkdir build
cd build
cmake `clsdk-cmake-args` ..
make -j $(nproc)
cltester tests.wasm
```

## Fetching the Schema

This uses cleos to fetch the schema. cleos's `-v` option shows print output.

```
$ cleos -v push action example graphqlschema '[]' -p alice

executed transaction: 79a16e17d6bde46a219a9e721ed17d610bbf7c2fa988f7db14e44b7e7fda97ae  96 bytes  185 us
#       example <= example::graphqlschema       ""
>> type animal {
>>     name: String!
>>     type: String!
>>     owner: String!
>>     purchase_price: String!
>> }
>> type Query {
>>     contract: String!
>>     animal(name: String!): animal
>> }
```

## Querying the Contract Name

This queries the contract name:

```
$ cleos -v push action example graphql '["{contract}",""]' -p alice

executed transaction: 50fa29906ed5b40b3c51dc396f2262c292eda6970813909ff3e06ebf18f618f2  104 bytes  177 us
#       example <= example::graphql             {"query":"{contract}"}
>> {"data": {"contract":"example"}}
```

## Querying an Animal

This queries a specific animal.

```
$ cleos -v push action example graphql '["{animal(name:\"fido\"){name,type,owner,purchase_price}}",""]' -p alice

executed transaction: 636a96b15cf7c1478992fc8f27716da7fc9c60105144a4c43ecf21035e840454  152 bytes  181 us
#       example <= example::graphql             {"query":"{animal(name:\"fido\"){name,type,owner,purchase_price}}"}
>> {"data": {"animal":{"name":"fido","type":"dog","owner":"alice","purchase_price":"100.0000 EOS"}}}
```

Here's the GraphQL query above:

```
{
  animal(name: "fido") {
    name
    type
    owner
    purchase_price
  }
}
```

Here's the formatted output:

```
{
    "data": {
        "animal": {
            "name": "fido",
            "type": "dog",
            "owner": "alice",
            "purchase_price": "100.0000 EOS"
        }
    }
}
```
