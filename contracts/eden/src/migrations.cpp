#include <events.hpp>
#include <migrations.hpp>

namespace eden
{
   void migrations::set(const migration_variant& new_value)
   {
      eosio::check(migration_sing.get().index() == new_value.index(),
                   "Cannot change current migration");
      migration_sing.set(new_value, contract);
   }

   void migrations::clear_all() { clear_singleton(migration_sing, contract); }

   void migrations::init()
   {
      constexpr size_t index = std::variant_size_v<migration_variant> - 1;
      migration_sing.set(std::variant_alternative_t<index, migration_variant>(), contract);
      push_event(migration_event{static_cast<eosio::varuint32>(index)}, contract);
   }

   uint32_t migrations::migrate_some(uint32_t max_steps)
   {
      auto state = migration_sing.get_or_default(migration_variant());
      while (max_steps > 0 && state.index() != std::variant_size_v<migration_variant> - 1)
      {
         std::visit(
             [&](auto& current_state) {
                max_steps = current_state.migrate_some(contract, max_steps);
                if (max_steps)
                {
                   push_event(migration_event{static_cast<eosio::varuint32>(state.index())},
                              contract);
                   constexpr std::size_t next_index =
                       boost::mp11::mp_find<migration_variant,
                                            std::decay_t<decltype(current_state)>>::value +
                       1;
                   if constexpr (next_index < std::variant_size_v<migration_variant>)
                   {
                      state.emplace<next_index>();
                   }
                }
             },
             state);
      }
      migration_sing.set(state, contract);
      return max_steps;
   }
}  // namespace eden
