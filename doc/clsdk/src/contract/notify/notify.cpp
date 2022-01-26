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
                           std::string memo)
      {
         // Only track incoming transfers
         if (from == get_self())
            return;

         // The dispatcher has already checked the token contract.
         // We need to check the token type.
         eosio::check(quantity.symbol == eosio::symbol{"EOS", 4},
                      "This contract does not deal with this token");

         // Record the change
         add_balance(from, quantity);
      }

      // Action: user buys a dog
      void buydog(eosio::name user, eosio::name dog, const eosio::asset& price)
      {
         require_auth(user);
         eosio::check(price.symbol == eosio::symbol{"EOS", 4},
                      "This contract does not deal with this token");
         eosio::check(price.amount >= 50'0000, "Dogs cost more than that");
         sub_balance(user, price);
         animal_table table{get_self(), get_self().value};
         table.emplace(user, [&](auto& record) {
            record.name = dog;
            record.type = "dog"_n;
            record.owner = user;
            record.purchase_price = price;
         });
      }

      // This is not an action; it's a function internal to the contract
      void add_balance(eosio::name owner, const eosio::asset& quantity)
      {
         balance_table table(get_self(), get_self().value);
         auto record = table.find(owner.value);
         if (record == table.end())
            table.emplace(get_self(), [&](auto& a) {
               a.owner = owner;
               a.balance = quantity;
            });
         else
            table.modify(record, eosio::same_payer, [&](auto& a) { a.balance += quantity; });
      }

      // This is not an action; it's a function internal to the contract
      void sub_balance(eosio::name owner, const eosio::asset& quantity)
      {
         balance_table table(get_self(), get_self().value);
         const auto& record = table.get(owner.value, "user does not have a balance");
         eosio::check(record.balance.amount >= quantity.amount, "not enough funds deposited");
         table.modify(record, owner, [&](auto& a) { a.balance -= quantity; });
      }
   };

   EOSIO_ACTIONS(example_contract,
                 "example"_n,
                 notify("eosio.token"_n, transfer),  // Hook up notification
                 action(buydog, user, dog, price))
}  // namespace example

EOSIO_ACTION_DISPATCHER(example::actions)

EOSIO_ABIGEN(actions(example::actions),
             table("balance"_n, example::balance),
             table("animal"_n, example::animal))
