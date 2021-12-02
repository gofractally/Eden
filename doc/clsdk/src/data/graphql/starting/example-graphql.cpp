#include "example.hpp"

// GraphQL Support
#include <btb/graphql.hpp>

// EOSIO_REFLECT2; augments methods with argument names
#include <eosio/reflection2.hpp>

// The root of GraphQL queries
struct Query
{
   // Identify the contract
   eosio::name contract;

   // Retrieve an animal, if it exists
   std::optional<example::animal> animal(eosio::name name) const
   {
      example::animal_table table{contract, contract.value};
      auto it = table.find(name.value);
      if (it != table.end())
         return *it;
      else
         return std::nullopt;
   }
};
EOSIO_REFLECT2(Query,                  //
               contract,               // query a field
               method(animal, "name")  // query a method; identifies the argument names
)

// Action: execute a GraphQL query and print the result
void example::example_contract::graphql(const std::string& query)
{
   Query root{get_self()};
   eosio::print(btb::gql_query(root, query, ""));
}

// Action: print the GraphQL schema
void example::example_contract::graphqlschema()
{
   eosio::print(btb::get_gql_schema<Query>());
}
