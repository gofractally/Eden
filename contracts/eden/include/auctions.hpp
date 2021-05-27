#pragma once

#include <constants.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/time.hpp>
#include <globals.hpp>

namespace eden
{
   struct migrate_auction_v0
   {
      uint64_t last_auction_id = 0;
      uint32_t migrate_some(eosio::name contract, uint32_t max_steps);
   };
   EOSIO_REFLECT(migrate_auction_v0, last_auction_id);

   // All active auctions
   struct auction
   {
      uint64_t asset_id;
      eosio::time_point_sec last_known_end_time;
      uint64_t primary_key() const { return asset_id; }
      uint64_t by_end_time() const { return last_known_end_time.sec_since_epoch(); }
   };
   EOSIO_REFLECT(auction, asset_id, last_known_end_time);
   using auction_table_type = eosio::multi_index<
       "auctions"_n,
       auction,
       eosio::indexed_by<"bytime"_n,
                         eosio::const_mem_fun<auction, uint64_t, &auction::by_end_time>>>;

   class auctions
   {
     private:
      eosio::name contract;
      auction_table_type auction_tb;
      globals globals;

     public:
      explicit auctions(eosio::name contract)
          : contract(contract), auction_tb(contract, default_scope), globals(contract)
      {
      }
      void add_auction(uint64_t asset_id);
      void add_auction(uint64_t asset_id, uint32_t end_time);
      bool has_auction(uint64_t auction_id);
      uint32_t finish_auctions(uint32_t);
      void clear_all();
   };
}  // namespace eden
