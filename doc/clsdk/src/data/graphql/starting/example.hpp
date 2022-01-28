#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>

namespace example
{
   // Keep track of deposited funds
   struct balance
   {
      eosio::name owner;
      eosio::asset balance;

      uint64_t primary_key() const { return owner.value; }
   };
   EOSIO_REFLECT(balance, owner, balance)
   typedef eosio::multi_index<"balance"_n, balance> balance_table;

   // A purchased animal
   struct animal
   {
      eosio::name name;
      eosio::name type;
      eosio::name owner;
      eosio::asset purchase_price;

      uint64_t primary_key() const { return name.value; }
   };
   EOSIO_REFLECT(animal, name, type, owner, purchase_price)
   typedef eosio::multi_index<"animal"_n, animal> animal_table;

   struct example_contract : public eosio::contract
   {
      using eosio::contract::contract;

      void notify_transfer(eosio::name from,
                           eosio::name to,
                           const eosio::asset& quantity,
                           std::string memo);

      void buydog(eosio::name user, eosio::name dog, const eosio::asset& price);

      void add_balance(eosio::name owner, const eosio::asset& quantity);

      void sub_balance(eosio::name owner, const eosio::asset& quantity);

      // Action: execute a GraphQL query and print the result
      void graphql(const std::string& query);

      // Action: print the GraphQL schema
      void graphqlschema();
   };

   EOSIO_ACTIONS(example_contract,
                 "example"_n,
                 notify("eosio.token"_n, transfer),  // Hook up notification
                 action(buydog, user, dog, price),
                 action(graphql, query),
                 action(graphqlschema))
}  // namespace example
