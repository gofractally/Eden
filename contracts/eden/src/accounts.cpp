#include <accounts.hpp>

namespace eden
{
   std::optional<account> accounts::get_account(eosio::name owner)
   {
      auto record = account_tb.find(owner.value);
      if (record != account_tb.end())
         return *record;
      return std::nullopt;
   }

   void accounts::add_balance(eosio::name owner, const eosio::asset& quantity)
   {
      auto record = account_tb.find(owner.value);
      if (record == account_tb.end())
      {
         // TODO: create another global
         eosio::check(quantity >= globals.get().minimum_donation,
                      "insufficient deposit to open an account");
         account_tb.emplace(
             contract, [&](auto& a) { a.value = account_v0{.owner = owner, .balance = quantity}; });
      }
      else
      {
         account_tb.modify(record, contract, [&](auto& a) { a.balance() += quantity; });
      }
   }

   void accounts::sub_balance(eosio::name owner, const eosio::asset& quantity)
   {
      auto record = account_tb.find(owner.value);
      eosio::check(record != account_tb.end() && record->balance() >= quantity,
                   "insufficient balance");
      if (record->balance() == quantity)
         account_tb.erase(record);
      else
         account_tb.modify(record, contract, [&](auto& r) { r.balance() -= quantity; });
   }

   void accounts::clear_all()
   {
      auto accounts_itr = account_tb.lower_bound(0);
      while (accounts_itr != account_tb.end())
         account_tb.erase(accounts_itr++);
   }
}  // namespace eden
