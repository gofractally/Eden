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

   struct global_data_v1;

   struct global_data_v0
   {
      std::string community;
      eosio::asset minimum_donation;
      eosio::asset auction_starting_bid;
      uint32_t auction_duration;
      contract_stage_type stage;
      global_data_v1 upgrade() const;
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
      uint32_t election_round_time_sec =
          60 * 60;  // each round lasts 1 hour (TODO: + time to report results)
      eosio::asset election_donation;
      auto upgrade() const { return *this; }
   };
   EOSIO_REFLECT(global_data_v1, base global_data_v0, election_start_time);

   using global_variant = std::variant<global_data_v0, global_data_v1>;
   using global_singleton = eosio::singleton<"global"_n, global_variant>;

   global_singleton& get_global_singleton(eosio::name contract);

   // For use in tester only
   void tester_clear_global_singleton();

   struct globals
   {
     private:
      eosio::name contract;
      global_data_v1 data;

     public:
      explicit globals(eosio::name contract);
      explicit globals(eosio::name contract, const global_data_v1& initial_value);
      const global_data_v1& get() { return data; }
      void check_active() const;
      eosio::symbol default_token() const { return data.minimum_donation.symbol; }
      void set_stage(contract_stage stage);
      void set_election_start_time(uint32_t time);
      void set_election_donation(eosio::asset amount);
   };
}  // namespace eden
