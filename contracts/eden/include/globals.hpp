#pragma once

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

   struct global_data
   {
      std::string community;
      eosio::asset minimum_donation;
      eosio::asset auction_starting_bid;
      uint32_t auction_duration;
      contract_stage_type stage;
   };
   EOSIO_REFLECT(global_data,
                 community,
                 minimum_donation,
                 auction_starting_bid,
                 auction_duration,
                 stage)

   using global_singleton = eosio::singleton<"global"_n, global_data>;

   global_singleton& get_global_singleton(eosio::name contract);

   struct globals
   {
     private:
      eosio::name contract;
      global_data data;

     public:
      explicit globals(eosio::name contract)
          : contract(contract), data(get_global_singleton(contract).get())
      {
      }
      explicit globals(eosio::name contract, const global_data& initial_value);
      const global_data& get() { return data; }
      void check_active() const;
      eosio::symbol default_token() const { return data.minimum_donation.symbol; }
      void set_stage(contract_stage stage);
   };
}  // namespace eden
