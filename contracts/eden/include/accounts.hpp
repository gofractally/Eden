#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <globals.hpp>
#include <utils.hpp>

namespace eden
{
   struct migrate_account_v0
   {
      eosio::name last_visited;
      // user_total = \sum balance(account) \forall account <= last_visited
      eosio::asset user_total;
      uint32_t migrate_some(eosio::name contract, uint32_t max_steps);
      void adjust_balance(eosio::name owner, eosio::asset amount);
   };
   EOSIO_REFLECT(migrate_account_v0, last_visited, user_total)

   struct account_v0
   {
      eosio::name owner;
      eosio::asset balance;

      uint64_t primary_key() const { return owner.value; }
   };
   EOSIO_REFLECT(account_v0, owner, balance)

   using account_variant = std::variant<account_v0>;

   // invariant: The total of all accounts (including internal and user accounts)
   // is equal to the eosio.token balance of the contract.
   //
   // scopes:
   // - default_scope: users
   // - "owned": internal accounting
   // - "outgoing": Should never exist outside a transaction.
   struct account
   {
      account_variant value;
      EDEN_FORWARD_MEMBERS(value, owner, balance);
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(account, value)

   using account_table_type = eosio::multi_index<"account"_n, account>;

   class accounts
   {
     private:
      eosio::name contract;
      account_table_type account_tb;
      globals globals;

     public:
      accounts(eosio::name contract, eosio::name scope = eosio::name{default_scope})
          : contract(contract), account_tb(contract, scope.value), globals(contract)
      {
      }

      std::optional<account> get_account(eosio::name owner);
      void add_balance(eosio::name owner, const eosio::asset& quantity);
      void sub_balance(eosio::name owner, const eosio::asset& quantity);

      // this method is used only for administrative purposes,
      // it should never be used outside genesis or test environments
      void clear_all();
   };

}  // namespace eden
