# GraphQL: Proxy Objects

Database objects don't normally provide a GraphQL-friendly interface. e.g. `example::animal` provides underscore_names, but GraphQL consumers usually expect mixedCaseNames. Proxy objects may provide a different interface; they may also add additional methods.

## Example

This is a modification of `example-graphql.cpp` from [Getting Started](../starting/index.html).

```c++
#include <btb/graphql.hpp>
#include <eosio/reflection2.hpp>
#include "example.hpp"

// GraphQL proxy for example::animal
struct Animal
{
   // The proxy holds a copy of the original database object instead
   // of holding a pointer or reference. This is necessary because
   // the database object gets destroyed when the table object goes
   // out of scope from within Query::animal(). A potential workaround
   // is to make the table object a member of the contract object.
   example::animal obj;

   // These methods have no arguments, so act like fields in GraphQL
   auto name() const { return obj.name; }
   auto type() const { return obj.type; }
   auto owner() const { return obj.owner; }
   auto purchasePrice() const { return obj.purchase_price; }

   // This method has an argument, so needs method(...) in the
   // EOSIO_REFLECT2 definition below.
   auto isA(eosio::name type) const { return type == obj.type; }
};
EOSIO_REFLECT2(Animal, name, type, owner, purchasePrice, method(isA, "type"))

struct Query
{
   eosio::name contract;

   // Returns a Proxy object instead of returning the original object
   std::optional<Animal> animal(eosio::name name) const
   {
      example::animal_table table{contract, contract.value};
      auto it = table.find(name.value);
      if (it != table.end())
         return Animal{*it};
      else
         return std::nullopt;
   }
};
EOSIO_REFLECT2(Query,                  //
               contract,               // query a field
               method(animal, "name")  // query a method; identifies the argument names
)

void example::example_contract::graphql(const std::string& query)
{
   Query root{get_self()};
   eosio::print(btb::gql_query(root, query, ""));
}

void example::example_contract::graphqlschema()
{
   eosio::print(btb::get_gql_schema<Query>());
}
```

## Example Query

This query:

```
{
  animal(name: "fido") {
    name
    type
    owner
    purchasePrice
    isACat: isA(type: "cat")
    isADog: isA(type: "dog")
  }
}
```

Produces this result:

```json
{
  "data": {
    "animal": {
      "name": "fido",
      "type": "dog",
      "owner": "alice",
      "purchasePrice": "100.0000 EOS",
      "isACat": false,
      "isADog": true
    }
  }
}
```
