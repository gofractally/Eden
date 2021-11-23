#pragma once

#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/privileged.hpp>

#if defined(COMPILING_TESTS)
#include <eosio/tester.hpp>
#endif

namespace activate_feature
{
   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;
      void activate(eosio::checksum256& feature_digest);
      void setcode() {}
   };
   EOSIO_ACTIONS(contract, "eosio"_n, action(activate, feature_digest), action(setcode))

#if defined(COMPILING_TESTS)
   void activate(eosio::test_chain& chain, const std::vector<eosio::checksum256>& features)
   {
      chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "activate_feature.wasm");
      for (auto& feature : features)
         chain.as("eosio"_n).act<activate_feature::actions::activate>(feature);
      chain.transact(
          {eosio::action{{{"eosio"_n, "active"_n}},
                         "eosio"_n,
                         "setcode"_n,
                         std::make_tuple("eosio"_n, uint8_t{0}, uint8_t{0}, std::vector<char>{})}});
      chain.finish_block();
      chain.finish_block();
   }
#endif

}  // namespace activate_feature
