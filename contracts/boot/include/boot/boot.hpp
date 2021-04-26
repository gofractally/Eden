#pragma once

#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/privileged.hpp>

namespace boot
{
   class boot_contract : public eosio::contract
   {
     public:
      using contract::contract;
      void boot();
      void setcode() {}
   };
   EOSIO_ACTIONS(boot_contract, "eosio"_n, boot, setcode)
}  // namespace boot
