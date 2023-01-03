#pragma once

#include <eosio/eosio.hpp>
#include <string>

#include <constants.hpp>
#include <globals.hpp>
#include <utils.hpp>

namespace eden
{

   inline uint128_t round_account_key(eosio::name account,
                                      eosio::time_point end_vote_time,
                                      uint8_t round)
   {
      return (static_cast<uint128_t>(account.value) << 64) |
             (static_cast<uint64_t>(end_vote_time.sec_since_epoch()) << 32) | round;
   }

   struct badge_v0
   {
      uint64_t id;
      eosio::name account;
      uint8_t round;
      eosio::time_point vote_time;
      eosio::time_point end_vote_time;

      uint64_t primary_key() const { return id; }
      uint128_t by_round() const { return round_account_key(account, end_vote_time, round); }
      uint64_t by_vote_time() const { return vote_time.sec_since_epoch(); }
   };
   EOSIO_REFLECT(badge_v0, id, account, round, vote_time, end_vote_time)
   using badge_variant = std::variant<badge_v0>;

   struct badge
   {
      badge_variant value;
      EDEN_FORWARD_MEMBERS(value, id, account, round, vote_time, end_vote_time)
      EDEN_FORWARD_FUNCTIONS(value, primary_key, by_round, by_vote_time)
   };
   EOSIO_REFLECT(badge, value)
   using badge_table_type = eosio::multi_index<
       "badge"_n,
       badge,
       eosio::indexed_by<"byround"_n, eosio::const_mem_fun<badge, uint128_t, &badge::by_round>>,
       eosio::indexed_by<"byvotetime"_n,
                         eosio::const_mem_fun<badge, uint64_t, &badge::by_vote_time>>>;

   class badges
   {
     private:
      eosio::name contract;
      badge_table_type badge_tb;
      globals globals;

     public:
      badges(eosio::name contract)
          : contract(contract), badge_tb(contract, default_scope), globals(contract)
      {
      }

      void create_badge(eosio::name account);
      uint32_t send_badges(uint32_t max_steps);
   };

}  // namespace eden