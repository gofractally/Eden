#pragma once

#include <eosio/asset.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/name.hpp>
#include <eosio/time.hpp>
#include <utils.hpp>
#include <variant>
#include <vector>

namespace eden
{
   struct member;

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

   class accounts;

   bool setup_distribution(eosio::name contract, eosio::block_timestamp init = {});
   bool setup_distribution(eosio::name contract,
                           accounts& accounts,
                           eosio::block_timestamp init = {});
   uint32_t distribute_monthly(eosio::name contract, uint32_t max_steps);
   void init_pools(eosio::name contract);
   void process_election_distribution(eosio::name contract);

   struct distribution_account_v0
   {
      uint64_t id;
      eosio::name owner;
      eosio::block_timestamp distribution_time;
      uint8_t rank;
      eosio::asset balance;
      uint64_t primary_key() const { return id; }
      uint128_t by_owner() const
      {
         return (uint128_t(owner.value) << 64) | make_account_scope(distribution_time, rank).value;
      }
      uint64_t by_time() const { return make_account_scope(distribution_time, rank).value; }
   };
   EOSIO_REFLECT(distribution_account_v0, id, owner, distribution_time, rank, balance);
   using distribution_account_variant = std::variant<distribution_account_v0>;
   struct distribution_account
   {
      distribution_account_variant value;
      EDEN_FORWARD_MEMBERS(value, id, owner, distribution_time, rank, balance);
      EDEN_FORWARD_FUNCTIONS(value, primary_key, by_owner, by_time)
   };
   EOSIO_REFLECT(distribution_account, value)
   using distribution_account_table_type = eosio::multi_index<
       "distrib"_n,
       distribution_account,
       eosio::indexed_by<
           "byowner"_n,
           eosio::const_mem_fun<distribution_account, uint128_t, &distribution_account::by_owner>>,
       eosio::indexed_by<
           "bytime"_n,
           eosio::const_mem_fun<distribution_account, uint64_t, &distribution_account::by_time>>>;

   class distributions
   {
     private:
      eosio::name contract;

     public:
      distributions(eosio::name contract) : contract(contract) {}
      uint32_t on_election_kick(eosio::name member, uint64_t& key, uint32_t max_steps);
      void on_resign(const member& member);
      uint32_t gc(uint32_t);
      void clear_all();
   };
}  // namespace eden
