#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <string>

namespace eden
{
   class eden : public eosio::contract
   {
     public:
      using contract::contract;

      eden(eosio::name receiver, eosio::name code, eosio::datastream<const char*> ds)
          : contract(receiver, code, ds)
      {
      }

      void notify_transfer(eosio::name from,
                           eosio::name to,
                           const eosio::asset& quantity,
                           std::string memo);

      void hi(eosio::name user);
   };

   EOSIO_ACTIONS(eden, "eden"_n, hi, notify transfer)
}  // namespace eden
