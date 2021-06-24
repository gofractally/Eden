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

   struct distribution_point_v0
   {
      eosio::block_timestamp distribution_time;
      uint8_t rank;
      uint64_t primary_key() const { return make_account_scope(distribution_time, rank).value; }
   };
   EOSIO_REFLECT(distribution_point_v0, distribution_time, rank)
   using distribution_point_variant = std::variant<distribution_point_v0>;

   struct distribution_point
   {
      distribution_point_variant value;
      EDEN_FORWARD_MEMBERS(value, distribution_time, rank)
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(distribution_point, value)
   using distribution_point_table_type = eosio::multi_index<"distpoint"_n, distribution_point>;

   class distributions
   {
     private:
      eosio::name contract;

     public:
      distributions(eosio::name contract) : contract(contract) {}
      uint32_t gc(uint32_t);
      void clear_all();
   };
}  // namespace eden
