#include <constants.hpp>
#include <globals.hpp>

namespace eden
{
   global_singleton& get_global_singleton(eosio::name contract)
   {
      static global_singleton result(contract, default_scope);
      return result;
   }

   globals::globals(eosio::name contract, const global_data& initial_value)
       : contract(contract), data(initial_value)
   {
      auto& singleton = get_global_singleton(contract);
      eosio::check(!singleton.exists(), "Singleton is already initialized");
      singleton.set(initial_value, contract);
   }

   void globals::check_active() const
   {
      eosio::check(data.stage == contract_stage::active, "Contract not active");
   }

   void globals::set_stage(contract_stage stage)
   {
      data.stage = stage;
      get_global_singleton(contract).set(data, eosio::same_payer);
   }
}  // namespace eden
