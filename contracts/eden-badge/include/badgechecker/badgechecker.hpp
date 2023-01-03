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

      void check_authorizer(eosio::name org, eosio::name authorizer);
      void notify_initsimple(eosio::name org,
                             eosio::name creator,
                             eosio::name badge,
                             std::vector<eosio::name> parent_badges,
                             std::string offchain_lookup_data,
                             std::string onchain_lookup_data,
                             std::vector<eosio::name> consumers,
                             std::string memo);
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
