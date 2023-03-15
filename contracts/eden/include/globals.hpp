#pragma once

#include <chrono>
#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/singleton.hpp>

namespace eden
{
   using contract_stage_type = uint8_t;
   enum contract_stage : contract_stage_type
   {
      genesis,
      active
   };

   struct migrate_global_v0
   {
      uint32_t migrate_some(eosio::name contract, uint32_t max_steps);
   };
   EOSIO_REFLECT(migrate_global_v0)

   // struct global_data_v1;
   struct global_data_v2;

   struct global_data_v0
   {
      std::string community;
      eosio::asset minimum_donation;
      eosio::asset auction_starting_bid;
      uint32_t auction_duration;
      contract_stage_type stage;
      global_data_v2 upgrade() const;
   };
   EOSIO_REFLECT(global_data_v0,
                 community,
                 minimum_donation,
                 auction_starting_bid,
                 auction_duration,
                 stage)

   struct global_data_v1 : global_data_v0
   {
      uint32_t election_start_time = 0xffffffffu;  // seconds from the start of Sunday
      uint32_t election_round_time_sec = 60 * 60;
      global_data_v2 upgrade() const;
   };
   EOSIO_REFLECT(global_data_v1, base global_data_v0, election_start_time, election_round_time_sec);

   struct global_data_v2 : global_data_v1
   {
      uint8_t max_month_withdraw = 3;
      global_data_v2 upgrade() const { return *this; }
   };
   EOSIO_REFLECT(global_data_v2, base global_data_v1, max_month_withdraw);

   using global_variant = std::variant<global_data_v0, global_data_v1, global_data_v2>;
   using global_singleton = eosio::singleton<"global"_n, global_variant>;

   global_singleton& get_global_singleton(eosio::name contract);

   // For use in tester only
   void tester_clear_global_singleton();

   struct globals
   {
     private:
      eosio::name contract;
      global_data_v2 data;

     public:
      explicit globals(eosio::name contract);
      explicit globals(eosio::name contract, const global_data_v2& initial_value);
      const global_data_v2& get() { return data; }
      void check_active() const;
      eosio::symbol default_token() const { return data.minimum_donation.symbol; }
      void set_stage(contract_stage stage);
      void set_election_start_time(uint32_t time);
      void set_election_round_duration(uint32_t duration);
      void set_minimum_donation_fee(eosio::asset new_minimum_donation);
   };
}  // namespace eden
