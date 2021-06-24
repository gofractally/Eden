#include <accounts.hpp>
#include <distributions.hpp>
#include <elections.hpp>
#include <members.hpp>
#include <token/token.hpp>

namespace eden
{
   uint32_t migrate_account_v0::migrate_some(eosio::name contract, uint32_t max_steps)
   {
      account_table_type user_tb(contract, default_scope);
      if (user_total.symbol == eosio::symbol())
      {
         user_total = eosio::asset{0, globals{contract}.default_token()};
      }
      bool done = false;
      for (auto iter = user_tb.upper_bound(last_visited.value), end = user_tb.end(); max_steps > 0;
           ++iter, --max_steps)
      {
         if (iter == end)
         {
            done = true;
            break;
         }
         user_total += iter->balance();
         last_visited = iter->owner();
      }
      if (done)
      {
         account_table_type system_tb(contract, "owned"_n.value);
         auto total_balance = token::contract::get_balance(
             token_contract, contract, globals{contract}.default_token().code());
         eosio::check(total_balance >= user_total,
                      "Invariant failure: not enough funds to cover user balances");
         if (total_balance != user_total)
         {
            auto iter = system_tb.find("master"_n.value);
            if (iter == system_tb.end())
            {
               system_tb.emplace(contract, [&](auto& row) {
                  row.value =
                      account_v0{.owner = "master"_n, .balance = total_balance - user_total};
               });
               --max_steps;
            }
            else
            {
               eosio::check(iter->balance() == total_balance - user_total, "Incorrect balance");
            }
         }
      }
      return max_steps;
   }

   void migrate_account_v0::adjust_balance(eosio::name owner, eosio::asset amount)
   {
      if (owner <= last_visited)
      {
         user_total += amount;
      }
   }

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
      if (account_tb.get_scope() == "owned"_n.value)
      {
         setup_distribution(contract);
      }
      if (record == account_tb.end())
      {
         // TODO: create another global
         auto minimum_donation = globals.get().minimum_donation;
         if (globals.get().election_donation.symbol != eosio::symbol())
         {
            minimum_donation = std::min(minimum_donation, globals.get().election_donation);
         }
         eosio::check(account_tb.get_scope() != default_scope || quantity >= minimum_donation,
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
