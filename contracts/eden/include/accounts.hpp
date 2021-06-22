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

   inline eosio::name make_account_scope(eosio::block_timestamp distribution_time, uint8_t rank)
   {
      return eosio::name{"dist"_n.value | (static_cast<uint64_t>(distribution_time.slot) << 12) |
                         (rank << 4)};
   }

   struct pool_v0
   {
      eosio::name name;
      uint8_t monthly_distribution_pct;
      uint64_t primary_key() const { return name.value; }
   };
   EOSIO_REFLECT(pool_v0, name, monthly_distribution_pct)
   using pool_variant = std::variant<pool_v0>;
   struct pool
   {
      pool_variant value;
      EDEN_FORWARD_MEMBERS(value, name, monthly_distribution_pct)
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(pool, value)
   using pool_table_type = eosio::multi_index<"pools"_n, pool>;

   struct next_distribution
   {
      eosio::block_timestamp distribution_time;
   };
   EOSIO_REFLECT(next_distribution, distribution_time)

   struct election_distribution
   {
      eosio::block_timestamp distribution_time;
      eosio::asset amount;
   };
   EOSIO_REFLECT(election_distribution, distribution_time, amount)

   struct current_distribution
   {
      eosio::block_timestamp distribution_time;
      eosio::name last_processed;
      std::vector<eosio::asset> rank_distribution;
   };
   EOSIO_REFLECT(current_distribution, distribution_time, last_processed, rank_distribution)

   using distribution_variant =
       std::variant<next_distribution, election_distribution, current_distribution>;
   struct distribution
   {
      distribution_variant value;
      EDEN_FORWARD_MEMBERS(value, distribution_time)
      uint64_t primary_key() const { return distribution_time().slot; }
   };
   EOSIO_REFLECT(distribution, value)

   using distribution_table_type = eosio::multi_index<"distribution"_n, distribution>;

   bool setup_distribution(eosio::name contract, eosio::block_timestamp init = {});
   uint32_t distribute_monthly(eosio::name contract, uint32_t max_steps);
   void init_pools(eosio::name contract);
   void process_election_distribution(eosio::name contract);

   struct distribution_point
   {
      eosio::block_timestamp distribution_time;
      uint8_t max_rank;
   };

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
