#pragma once

#include <config_badge.hpp>
#include <eosio/eosio.hpp>

namespace eden
{
   struct checks
   {
      eosio::name org;
      eosio::name checks_contract;

      auto primary_key() const { return org.value; }
   };
   EOSIO_REFLECT(checks, org, checks_contract)
   typedef eosio::multi_index<eosio::name("checks"), checks> checks_table;

   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;

      bool check_authorizer(name org, name creator);
      void notify_initsimple(name org,
                             name creator,
                             name badge,
                             vector<name> parent_badges,
                             string offchain_lookup_data,
                             string onchain_lookup_data,
                             vector<name> consumers,
                             string memo);
      void notify_givesimple(eosio::name org,
                             eosio::name badge,
                             eosio::name authorizer,
                             eosio::name to,
                             std::string memo);
   };

   EOSIO_ACTIONS(contract,
                 "badgechecker"_n,
                 notify(sbt_account, initsimple),
                 notify(sbt_account, givesimple))
}  // namespace eden
