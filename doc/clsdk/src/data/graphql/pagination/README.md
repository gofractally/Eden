# GraphQL: Pagination

clsdk's GraphQL library supports most of the [GraphQL Connection Model](https://graphql.org/learn/pagination/#complete-connection-model) for paging through large data sets.

## Example

This is a modification of `example-graphql.cpp` from [Getting Started](../starting/index.html).

```c++
// Include support for the connection model (pagination)
#include <btb/graphql_connection.hpp>

#include <eosio/reflection2.hpp>
#include "example.hpp"

struct Animal
{
   example::animal obj;

   auto name() const { return obj.name; }
   auto type() const { return obj.type; }
   auto owner() const { return obj.owner; }
   auto purchasePrice() const { return obj.purchase_price; }
};
EOSIO_REFLECT2(Animal, name, type, owner, purchasePrice)

// Define the AnimalConnection and AnimalEdge GraphQL types
constexpr const char AnimalConnection_name[] = "AnimalConnection";
constexpr const char AnimalEdge_name[] = "AnimalEdge";
using AnimalConnection =
    btb::Connection<btb::ConnectionConfig<Animal, AnimalConnection_name, AnimalEdge_name>>;

struct Query
{
   eosio::name contract;

   // Searches for and pages through the animals in the database
   //
   // The gt, ge, lt, and le arguments support searching for animals with
   // names which are greater-than, greater-than-or-equal-to, less-than,
   // or less-than-or-equal-to the values provided. If more than 1 of these
   // are used, then the result is the intersection of these.
   //
   // If first is non-null, it limits the result to the first animals found
   // which meet the other criteria (gt, ge, lt, le, before, after).
   // If last is non-null, it limits the result to the last animals found.
   // Using first and last together is allowed, but is not recommended since
   // it has an unusual semantic, which matches the GraphQL spec.
   //
   // If before is non-null, then the result is limited to records before it.
   // If after is non-null, then the result is limited to records after it.
   // before and after are opaque cursor values.

   AnimalConnection animals(std::optional<eosio::name> gt,
                            std::optional<eosio::name> ge,
                            std::optional<eosio::name> lt,
                            std::optional<eosio::name> le,
                            std::optional<uint32_t> first,
                            std::optional<uint32_t> last,
                            std::optional<std::string> before,
                            std::optional<std::string> after) const
   {
      example::animal_table table{contract, contract.value};

      return btb::make_connection<AnimalConnection,  // The type of connection to use
                                  eosio::name        // The key type (animal name)
                                  >(
          gt, ge, lt, le, first, last, before, after,
          table,  // Either a table or a secondary index
          [](auto& obj) {
             // This is the key used for searching in the table or index
             // provided above
             return obj.name;
          },
          [&](auto& obj) {
             // Convert an object found in the table into a proxy
             return Animal{obj};
          },
          // Hook up the lower_bound and upper_bound functions. These
          // do the actual search.
          [](auto& table, auto key) { return table.lower_bound(key.value); },
          [](auto& table, auto key) { return table.upper_bound(key.value); });
   }
};
EOSIO_REFLECT2(Query,  //
               method(animals, "gt", "ge", "lt", "le", "first", "last", "before", "after"))

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

### Get all animals in the database

```
{
  animals {
    edges {
      node {
        name
      }
    }
  }
}
```

### Get the first 5

```
{
  animals(first:5) {
    edges {
      node {
        name
      }
    }
  }
}
```

### Get the last 5

```
{
  animals(last:5) {
    edges {
      node {
        name
      }
    }
  }
}
```

### Get the first 5 starting with dog132

```
{
  animals(first: 5, ge: "dog132") {
    edges {
      node {
        name
      }
    }
  }
}
```

### Pagination

```
{
  animals(first: 5) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    edges {
      node {
        name
      }
    }
  }
}
```

The result includes this in its output:

```
"pageInfo": {
  "hasPreviousPage": false,
  "hasNextPage": true,
  "startCursor": "0000000000B0AE39",
  "endCursor": "000000009010184D"
},
```

There are more results (`hasNextPage` is true) and we know where to resume (`endCursor`). To get the next 5:

```
{
  animals(first: 5, after: "000000009010184D") {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
      endCursor
    }
    edges {
      node {
        name
      }
    }
  }
}
```
