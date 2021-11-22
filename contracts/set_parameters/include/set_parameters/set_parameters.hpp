#pragma once

#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/privileged.hpp>

#if defined(COMPILING_TESTS)
#include <eosio/tester.hpp>
#endif

namespace set_parameters
{
   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;
      void setparams(eosio::ignore<eosio::blockchain_parameters> params);
      void setcode() {}
   };
   EOSIO_ACTIONS(contract, "eosio"_n, action(setparams, params), action(setcode))

#if defined(COMPILING_TESTS)
   void setparams(eosio::test_chain& chain, const eosio::blockchain_parameters& params)
   {
      chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "set_parameters.wasm");
      chain.as("eosio"_n).act<set_parameters::actions::setparams>(params);
      chain.transact(
          {eosio::action{{{"eosio"_n, "active"_n}},
                         "eosio"_n,
                         "setcode"_n,
                         std::make_tuple("eosio"_n, uint8_t{0}, uint8_t{0}, std::vector<char>{})}});
   }
#endif

}  // namespace set_parameters
