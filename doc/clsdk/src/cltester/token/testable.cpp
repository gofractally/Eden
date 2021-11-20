#include "testable.hpp"

#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>

void example::example_contract::notify_transfer(eosio::name from,
                                                eosio::name to,
                                                const eosio::asset& quantity,
                                                std::string memo)
{
   if (from == get_self())
      return;
   eosio::check(quantity.symbol == eosio::symbol{"EOS", 4},
                "This contract does not deal with this token");
   add_balance(from, quantity);
}

void example::example_contract::buydog(eosio::name user, eosio::name dog, const eosio::asset& price)
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

void example::example_contract::add_balance(eosio::name owner, const eosio::asset& quantity)
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

void example::example_contract::sub_balance(eosio::name owner, const eosio::asset& quantity)
{
   balance_table table(get_self(), get_self().value);
   const auto& record = table.get(owner.value, "user does not have a balance");
   eosio::check(record.balance.amount >= quantity.amount, "not enough funds deposited");
   table.modify(record, owner, [&](auto& a) { a.balance -= quantity; });
}

EOSIO_ACTION_DISPATCHER(example::actions)

EOSIO_ABIGEN(actions(example::actions),
             table("balance"_n, example::balance),
             table("animal"_n, example::animal))
