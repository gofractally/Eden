#include <auctions.hpp>
#include <boost/mp11/algorithm.hpp>
#include <eosio/singleton.hpp>
#include <migrations.hpp>
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
   using migration_type = std::variant<migrate_auction_v0, no_migration<0>>;

   using migration_singleton = eosio::singleton<"migration"_n, migration_type>;

   void migrations::clear_all() { migration_singleton(contract, default_scope).remove(); }

   void migrations::init()
   {
      migration_singleton migration(contract, default_scope);
      migration.set(
          std::variant_alternative_t<std::variant_size_v<migration_type> - 1, migration_type>(),
          contract);
   }

   uint32_t migrations::migrate_some(uint32_t max_steps)
   {
      migration_singleton migration(contract, default_scope);
      auto state = migration.get_or_default(migration_type());
      while (state.index() != std::variant_size_v<migration_type> - 1)
      {
         std::visit(
             [&](auto& current_state) {
                max_steps = current_state.migrate_some(contract, max_steps);
                if (max_steps)
                {
                   constexpr std::size_t next_index =
                       boost::mp11::mp_find<migration_type,
                                            std::decay_t<decltype(current_state)>>::value +
                       1;
                   if constexpr (next_index < std::variant_size_v<migration_type>)
                   {
                      state.emplace<next_index>();
                   }
                }
             },
             state);
      }
      migration.set(state, contract);
      return max_steps;
   }
}  // namespace eden
