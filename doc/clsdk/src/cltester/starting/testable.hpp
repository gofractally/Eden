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

      // eosio.token transfer notification
      void notify_transfer(eosio::name from,
                           eosio::name to,
                           const eosio::asset& quantity,
                           std::string memo);

      // Action: user buys a dog
      void buydog(eosio::name user, eosio::name dog, const eosio::asset& price);

      // This is not an action; it's a function internal to the contract
      void add_balance(eosio::name owner, const eosio::asset& quantity);

      // This is not an action; it's a function internal to the contract
      void sub_balance(eosio::name owner, const eosio::asset& quantity);
   };

   EOSIO_ACTIONS(example_contract,
                 "example"_n,
                 notify("eosio.token"_n, transfer),  // Hook up notification
                 action(buydog, user, dog, price))
}  // namespace example
