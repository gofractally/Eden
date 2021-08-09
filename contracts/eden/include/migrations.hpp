#pragma once

#include <accounts.hpp>
#include <auctions.hpp>
#include <boost/mp11/algorithm.hpp>
#include <eosio/name.hpp>
#include <eosio/singleton.hpp>
#include <members.hpp>
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
   EOSIO_REFLECT(no_migration<1>);
   using migration_variant = std::variant<migrate_auction_v0,
                                          migrate_account_v0,
                                          no_migration<0>,
                                          migrate_member_v0,
                                          no_migration<1>>;

   using migration_singleton = eosio::singleton<"migration"_n, migration_variant>;

   class migrations
   {
     private:
      eosio::name contract;
      migration_singleton migration_sing;

     public:
      migrations(eosio::name contract) : contract(contract), migration_sing(contract, default_scope)
      {
      }
      void init();
      void clear_all();
      uint32_t migrate_some(uint32_t max_steps);
      template <typename T>
      std::optional<T> get()
      {
         if (migration_sing.exists())
         {
            auto state = migration_sing.get();
            if (auto* result = std::get_if<T>(&state))
            {
               return *result;
            }
         }
         return {};
      }
      void set(const migration_variant& new_value);
      template <typename T>
      bool is_completed()
      {
         return migration_sing.exists() &&
                migration_sing.get().index() > boost::mp11::mp_find<migration_variant, T>::value;
      }
   };
}  // namespace eden
