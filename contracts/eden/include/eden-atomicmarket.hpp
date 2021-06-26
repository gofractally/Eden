#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>

namespace eden::atomicmarket
{
   struct atomicmarket_contract : eosio::contract
   {
      using contract::contract;
      void init();
      void addconftoken(eosio::name token_contract, eosio::symbol token_symbol);
      void auctionbid(eosio::name bidder,
                      uint64_t auction_id,
                      eosio::asset bid,
                      eosio::name taker_marketplace);
      void auctclaimbuy(uint64_t auction_id);
      void auctclaimsel(uint64_t auction_id);
   };
   EOSIO_ACTIONS(atomicmarket_contract,
                 "atomicmarket"_n,
                 init,
                 addconftoken,
                 auctionbid,
                 auctclaimbuy,
                 auctclaimsel);
}  // namespace eden::atomicmarket
