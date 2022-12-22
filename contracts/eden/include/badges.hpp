#pragma once

#include <eosio/eosio.hpp>
#include <string>

#include <constants.hpp>
#include <utils.hpp>

namespace eden
{
   struct badge_v0
   {
      uint64_t id;
      eosio::name account;
      uint8_t round;
      eosio::time_point vote_time;
      std::string description;

      uint64_t primary_key() const { return id; }
   };
   EOSIO_REFLECT(badge_v0, id, account, round, vote_time, description)
   using badge_variant = std::variant<badge_v0>;

   struct badge
   {
      badge_variant value;
      EDEN_FORWARD_MEMBERS(value, id, account, round, vote_time, description)
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(badge, value)
   using badge_table_type = eosio::multi_index<"badge"_n, badge>;

   class badges
   {
     private:
      eosio::name contract;
      badge_table_type badge_tb;

     public:
      badges(eosio::name contract) : contract(contract), badge_tb(contract, default_scope) {}

      void create_badge(eosio::name account,
                        uint8_t round,
                        eosio::time_point election_date,
                        std::string& description);
      uint32_t send_badges(uint32_t max_steps);
   };

}  // namespace eden