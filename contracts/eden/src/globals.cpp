#include <constants.hpp>
#include <globals.hpp>

namespace eden
{
   global_data_v2 global_data_v0::upgrade() const
   {
      return {{*this}};
   }

   global_data_v2 global_data_v1::upgrade() const
   {
      return {*this};
   }

   static std::optional<global_singleton> global_singleton_inst;

   global_singleton& get_global_singleton(eosio::name contract)
   {
      if (!global_singleton_inst)
         global_singleton_inst.emplace(contract, default_scope);
      return *global_singleton_inst;
   }

   void tester_clear_global_singleton() { global_singleton_inst = {}; }

   globals::globals(eosio::name contract)
       : contract(contract),
         data(std::visit([](const auto& v) { return v.upgrade(); },
                         get_global_singleton(contract).get()))
   {
   }

   globals::globals(eosio::name contract, const global_data_v2& initial_value)
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

   void globals::set_election_start_time(uint32_t start_time)
   {
      data.election_start_time = start_time;
      get_global_singleton(contract).set(data, eosio::same_payer);
   }

   void globals::set_election_round_duration(uint32_t duration)
   {
      data.election_round_time_sec = duration;
      get_global_singleton(contract).set(data, eosio::same_payer);
   }

   void globals::set_minimum_donation_fee(eosio::asset new_minimum_donation)
   {
      data.minimum_donation = new_minimum_donation;
      get_global_singleton(contract).set(data, eosio::same_payer);
   }

   void globals::set_max_month_widthdraw(uint8_t months)
   {
      data.max_month_withdraw = months;
      get_global_singleton(contract).set(data, eosio::same_payer);
   }
}  // namespace eden
