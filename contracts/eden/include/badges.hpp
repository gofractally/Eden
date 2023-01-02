#pragma once

#include <eosio/eosio.hpp>
#include <string>

#include <constants.hpp>
#include <utils.hpp>

namespace eden
{
   inline uint128_t round_account_key(uint8_t round, eosio::name account)
   {
      return (static_cast<uint128_t>(round) << 64) | account.value;
   }

   struct badge_v0
   {
      uint64_t id;
      eosio::name account;
      uint8_t round;
      eosio::time_point vote_time;

      uint64_t primary_key() const { return id; }
      uint128_t by_round() const { return round_account_key(round, account); }
   };
   EOSIO_REFLECT(badge_v0, id, account, round, vote_time)
   using badge_variant = std::variant<badge_v0>;

   struct badge
   {
      badge_variant value;
      EDEN_FORWARD_MEMBERS(value, id, account, round, vote_time)
      EDEN_FORWARD_FUNCTIONS(value, primary_key, by_round)
   };
   EOSIO_REFLECT(badge, value)
   using badge_table_type = eosio::multi_index<
       "badge"_n,
       badge,
       eosio::indexed_by<"byround"_n, eosio::const_mem_fun<badge, uint128_t, &badge::by_round>>>;

   class badges
   {
     private:
      eosio::name contract;
      badge_table_type badge_tb;

     public:
      badges(eosio::name contract) : contract(contract), badge_tb(contract, default_scope) {}

      void create_badge(eosio::name account, uint8_t round);
      uint32_t send_badges(uint32_t max_steps);
   };

}  // namespace eden