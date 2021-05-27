#include <auctions.hpp>
#include <eosio/crypto.hpp>
#include <eosio/system.hpp>

namespace eden
{
   namespace atomicmarket
   {
      struct auction
      {
         uint64_t auction_id;
         eosio::name seller;
         std::vector<uint64_t> asset_ids;
         uint32_t end_time;
         bool assets_transferred;
         eosio::asset current_bid;
         eosio::name current_bidder;
         bool claimed_by_seller;
         bool claimed_by_buyer;
         eosio::name maker_marketplace;
         eosio::name taker_marketplace;
         eosio::name collection_name;
         double collection_fee;

         uint64_t primary_key() const { return auction_id; };

         eosio::checksum256 by_assets() const;
      };
      EOSIO_REFLECT(auction,
                    auction_id,
                    seller,
                    asset_ids,
                    end_time,
                    assets_transferred,
                    current_bid,
                    current_bidder,
                    claimed_by_seller,
                    claimed_by_buyer,
                    maker_marketplace,
                    taker_marketplace,
                    collection_name,
                    collection_fee);

      using auction_table_type = eosio::multi_index<
          "auctions"_n,
          auction,
          eosio::indexed_by<"byassets"_n,
                            eosio::const_mem_fun<auction, eosio::checksum256, &auction::by_assets>>>;
   }  // namespace atomicmarket

   void auctions::add_auction(uint64_t asset_id)
   {
      auction_tb.emplace(contract, [&](auto& row) {
         row.asset_id = asset_id;
         row.last_known_end_time =
             eosio::current_time_point() + eosio::seconds(globals.get().auction_duration);
      });
   }

   void auctions::add_auction(uint64_t asset_id, uint32_t end_time)
   {
      auction_tb.emplace(contract, [&](auto& row) {
         row.asset_id = asset_id;
         row.last_known_end_time = eosio::time_point_sec{end_time};
      });
   }

   bool auctions::has_auction(uint64_t asset_id)
   {
      return auction_tb.find(asset_id) != auction_tb.end();
   }

   uint32_t auctions::finish_auctions(uint32_t max_steps)
   {
      atomicmarket::auction_table_type market_tb(atomic_market_account,
                                                 atomic_market_account.value);
      const auto& asset_id_idx = market_tb.get_index<"byassets"_n>();

      const auto& end_time_idx = auction_tb.get_index<"bytime"_n>();
      auto iter = end_time_idx.begin();
      auto end = end_time_idx.end();
      eosio::time_point_sec current_time = eosio::current_time_point();
      for (; max_steps > 0 && iter != end && iter->last_known_end_time < current_time; --max_steps)
      {
         const auto& auction = *iter++;
         // Find the auction in atomicmarket if it exists.  There may be multiple auction rows
         // with these assets, as the asset can be reauctioned before we claim the funds.
         // We can distinguish the right auction by seller.
         auto key = eosio::sha256(reinterpret_cast<const char*>(&auction.asset_id),
                                  sizeof(auction.asset_id));
         auto market_iter = asset_id_idx.lower_bound(key);
         while (true)
         {
            if (market_iter->asset_ids.size() != 1 ||
                market_iter->asset_ids.front() != auction.asset_id)
            {
               market_iter = asset_id_idx.end();
               break;
            }
            if (market_iter->seller == contract)
            {
               break;
            }
            ++market_iter;
         }
         if (market_iter == asset_id_idx.end() || market_iter->claimed_by_seller)
         {
            auction_tb.erase(auction);
         }
         else
         {
            if (market_iter->end_time < current_time.sec_since_epoch())
            {
               if (market_iter->current_bidder != eosio::name())
               {
                  eosio::action{{contract, "active"_n},
                                atomic_market_account,
                                "auctclaimsel"_n,
                                market_iter->auction_id}
                      .send();
               }
               else
               {
                  eosio::action{{contract, "active"_n},
                                atomic_market_account,
                                "cancelauct"_n,
                                market_iter->auction_id}
                      .send();
                  eosio::action{{contract, "active"_n},
                                atomic_assets_account,
                                "burnasset"_n,
                                std::tuple(contract, auction.asset_id)};
               }
               auction_tb.erase(auction);
            }
            else
            {
               auction_tb.modify(auction, contract, [&](auto& row) {
                  row.last_known_end_time = eosio::time_point_sec(market_iter->end_time);
               });
            }
         }
      }
      return max_steps;
   }

   uint32_t migrate_auction_v0::migrate_some(eosio::name contract, uint32_t max_steps)
   {
      auctions auctions(contract);
      atomicmarket::auction_table_type auction_tb(atomic_market_account,
                                                  atomic_market_account.value);
      for (auto iter = auction_tb.upper_bound(last_auction_id), end = auction_tb.end();
           max_steps > 0 && iter != end; ++iter, --max_steps)
      {
         if (iter->seller == contract && iter->asset_ids.size() == 1)
         {
            auto asset_id = iter->asset_ids.front();
            if (!auctions.has_auction(asset_id))
            {
               auctions.add_auction(asset_id, iter->end_time);
            }
         }
         last_auction_id = iter->auction_id;
      }
      return max_steps;
   }

   void auctions::clear_all()
   {
      auto iter = auction_tb.begin();
      auto end = auction_tb.end();
      while (iter != end)
      {
         iter = auction_tb.erase(iter);
      }
   }

}  // namespace eden
