# GraphQL: Linking Objects

Proxy objects can link together to form graphs.

## Example

This is a modification of `example-graphql.cpp` from [Getting Started](../starting/index.html).

```c++
#include <btb/graphql.hpp>
#include <eosio/reflection2.hpp>
#include "example.hpp"

struct User;

// GraphQL proxy for example::animal
struct Animal
{
   eosio::name contract;
   example::animal obj;

   auto name() const { return obj.name; }
   auto type() const { return obj.type; }
   auto purchasePrice() const { return obj.purchase_price; }

   // Link to a proxy which represents owner
   User owner() const;
};
EOSIO_REFLECT2(Animal, name, type, purchasePrice, owner)

// GraphQL proxy which represents a user. This proxy may exist even
// if there are no database records for that user.
struct User
{
   eosio::name contract;
   eosio::name name;

   // User's remaining balance, if any
   std::optional<eosio::asset> balance() const
   {
      example::balance_table table{contract, contract.value};
      auto it = table.find(name.value);
      if (it != table.end())
         return it->balance;
      else
         return std::nullopt;
   }

   // Link to proxy objects which represent animals owned by user
   std::vector<Animal> animals() const
   {
      std::vector<Animal> result;
      example::animal_table table{contract, contract.value};

      // This is an inefficent approach and will time out if there are
      // too many animals in the table. We could add a secondary index,
      // but that would consume RAM. The blocks-to-browser system
      // supports secondary indexes which don't consume on-chain RAM.
      for (auto& animal : table)
         if (animal.owner == name)
            result.push_back(Animal{contract, animal});

      return result;
   }
};
EOSIO_REFLECT2(User, name, balance, animals)

User Animal::owner() const
{
   return {contract, obj.owner};
}

struct Query
{
   eosio::name contract;

   User user(eosio::name name) const { return {contract, name}; }

   std::optional<Animal> animal(eosio::name name) const
   {
      example::animal_table table{contract, contract.value};
      auto it = table.find(name.value);
      if (it != table.end())
         return Animal{contract, *it};
      else
         return std::nullopt;
   }
};
EOSIO_REFLECT2(Query, contract, method(user, "name"), method(animal, "name"))

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

## Example Queries

### Owner-to-animal links

Get information about Alice's and Joe's balances and animals. Joe has never interacted with the contract.

```
{
  alice: user(name: "alice") {
    name
    balance
    animals {
      name
      type
      purchasePrice
    }
  }
  joe: user(name: "joe") {
    name
    balance
    animals {
      name
      type
      purchasePrice
    }
  }
}
```

Result:

```json
{
  "data": {
    "alice": {
      "name": "alice",
      "balance": "90.0000 EOS",
      "animals": [
        {
          "name": "barf",
          "type": "dog",
          "purchasePrice": "110.0000 EOS"
        },
        {
          "name": "fido",
          "type": "dog",
          "purchasePrice": "100.0000 EOS"
        }
      ]
    },
    "joe": {
      "name": "joe",
      "balance": null,
      "animals": []
    }
  }
}
```

### Animal-to-owner links

```
{
  animal(name: "fido") {
    name
    type
    purchasePrice
    owner {
      name
      balance
    }
  }
}
```

Result:

```json
{
  "data": {
    "animal": {
      "name": "fido",
      "type": "dog",
      "purchasePrice": "100.0000 EOS",
      "owner": {
        "name": "alice",
        "balance": "90.0000 EOS"
      }
    }
  }
}
```

### Circular links

All animals owned by the person who owns fido

```
{
  animal(name: "fido") {
    owner {
      name
      animals {
        name
      }
    }
  }
}
```

Result:

```json
{
  "data": {
    "animal": {
      "owner": {
        "name": "alice",
        "animals": [
          {
            "name": "barf"
          },
          {
            "name": "fido"
          }
        ]
      }
    }
  }
}
```
