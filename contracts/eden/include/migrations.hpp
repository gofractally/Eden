#pragma once

#include <auctions.hpp>
#include <eosio/name.hpp>
#include <eosio/singleton.hpp>
#include <variant>

namespace eden
{
   // A specialization of this should always be the last type in the variant.
   template <int N>
   struct no_migration
   {
      uint32_t migrate_some(eosio::name contract, uint32_t max_steps) { return max_steps; }
   };
   EOSIO_REFLECT(no_migration<0>);
   using migration_variant = std::variant<migrate_auction_v0, no_migration<0>>;

   using migration_singleton = eosio::singleton<"migration"_n, migration_variant>;

   class migrations
   {
     private:
      eosio::name contract;

     public:
      migrations(eosio::name contract) : contract(contract) {}
      void init();
      void clear_all();
      uint32_t migrate_some(uint32_t max_steps);
   };
}  // namespace eden
