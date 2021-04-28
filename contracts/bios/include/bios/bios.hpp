#pragma once

#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/privileged.hpp>

namespace bios
{
   class bios_contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;
      void newaccount() {}
      void updateauth() {}
      void deleteauth() {}
      void linkauth() {}
      void setcode() {}
      void setabi() {}
      void canceldelay() {}
      void setpriv(eosio::name account, bool is_priv) { eosio::set_privileged(account, is_priv); }
   };
   EOSIO_ACTIONS(bios_contract,
                 "eosio"_n,
                 newaccount,
                 updateauth,
                 deleteauth,
                 linkauth,
                 setcode,
                 setabi,
                 canceldelay,
                 setpriv)
}  // namespace bios
