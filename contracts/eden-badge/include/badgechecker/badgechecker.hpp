#pragma once

#include <eosio/eosio.hpp>

#include <badgechecker.hpp>
#include <config_badge.hpp>
#include <constants.hpp>
#include <utils.hpp>

namespace eden
{
   struct permission_v0
   {
      eosio::name badge;
      std::vector<eosio::name> accounts;

      auto primary_key() const { return badge.value; }
   };
   EOSIO_REFLECT(permission_v0, badge, accounts)

   using permission_variant = std::variant<permission_v0>;

   struct permission
   {
      permission_variant value;
      EDEN_FORWARD_MEMBERS(value, badge, accounts)
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(permission, value)

   using permission_table_type = eosio::multi_index<"permission"_n, permission>;

   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;

      void check_authorization(eosio::name action, eosio::name badge, eosio::name authorizer);
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
      void setauth(eosio::name action, eosio::name badge, std::vector<eosio::name> accounts);
   };

   EOSIO_ACTIONS(contract,
                 "badgechecker"_n,
                 action(setauth, action, badge, accounts),
                 notify(sbt_account, initsimple),
                 notify(sbt_account, givesimple))
}  // namespace eden