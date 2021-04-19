#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <inductions.hpp>
#include <string>
#include <vector>

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

      void inductinit(uint64_t id,
                      eosio::name inviter,
                      eosio::name invitee,
                      std::vector<eosio::name> witnesses);

      void inductprofil(uint64_t id, new_member_profile new_member_profile);
   };

   EOSIO_ACTIONS(eden, "eden"_n, hi, inductinit, inductprofil, notify transfer)
}  // namespace eden
