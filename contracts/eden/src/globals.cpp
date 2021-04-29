#include <constants.hpp>
#include <globals.hpp>

namespace eden
{
   static std::optional<global_singleton> global_singleton_inst;

   global_singleton& get_global_singleton(eosio::name contract)
   {
      if (!global_singleton_inst)
         global_singleton_inst.emplace(contract, default_scope);
      return *global_singleton_inst;
   }

   void tester_clear_global_singleton() { global_singleton_inst = {}; }

   globals::globals(eosio::name contract, const global_data_v0& initial_value)
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
