#pragma once

#include <eosio/bytes.hpp>
#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/privileged.hpp>

#if defined(COMPILING_TESTS)
#include <eosio/tester.hpp>
#endif

namespace bios2
{
   struct abi_hash
   {
      eosio::name owner;
      eosio::checksum256 hash;

      uint64_t primary_key() const { return owner.value; }
   };
   EOSIO_REFLECT(abi_hash, owner, hash)

   typedef eosio::multi_index<"abihash"_n, abi_hash> abi_hash_table;

   class bios_contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;

      void onblock() {}

      void newaccount(eosio::ignore<eosio::name> creator,
                      eosio::ignore<eosio::name> name,
                      eosio::ignore<eosio::authority> owner,
                      eosio::ignore<eosio::authority> active)
      {
      }

      void updateauth(eosio::ignore<eosio::name> account,
                      eosio::ignore<eosio::name> permission,
                      eosio::ignore<eosio::name> parent,
                      eosio::ignore<eosio::authority> auth)
      {
      }

      void deleteauth(eosio::ignore<eosio::name> account, eosio::ignore<eosio::name> permission) {}

      void linkauth(eosio::ignore<eosio::name> account,
                    eosio::ignore<eosio::name> code,
                    eosio::ignore<eosio::name> type,
                    eosio::ignore<eosio::name> requirement)
      {
      }

      void unlinkauth(eosio::ignore<eosio::name> account,
                      eosio::ignore<eosio::name> code,
                      eosio::ignore<eosio::name> type)
      {
      }

      void canceldelay(eosio::ignore<eosio::permission_level> canceling_auth,
                       eosio::ignore<eosio::checksum256> trx_id)
      {
      }

      void setcode(eosio::ignore<eosio::name> account,
                   eosio::ignore<uint8_t> vmtype,
                   eosio::ignore<uint8_t> vmversion,
                   eosio::ignore<eosio::bytes> code)
      {
      }

      void setabi(eosio::name account, const eosio::bytes& abi);

      /**
       * Set privilege status for an account
       */
      void setpriv(eosio::name account, bool is_priv);

      /**
       * Set the resource limits of an account
       *
       * @param account - eosio::name of the account whose resource limit to be set
       * @param ram_bytes - ram limit in absolute bytes
       * @param net_weight - fractionally proportionate net limit of available resources based on (weight / total_weight_of_all_accounts)
       * @param cpu_weight - fractionally proportionate cpu limit of available resources based on (weight / total_weight_of_all_accounts)
       */
      void setalimits(eosio::name account,
                      int64_t ram_bytes,
                      int64_t net_weight,
                      int64_t cpu_weight);

      /**
       * Propose a new list of active producers.
       *
       * @param schedule - New list of active producers to set
       */
      void setprods(const std::vector<eosio::producer_authority>& schedule);

      /**
       * Set the blockchain parameters.
       */
      void setparams(const eosio::blockchain_parameters& params);

      /**
       * Check if the account eosio::name `from` passed in as param has authorization to access
       * current action, that is, if it is listed in the action’s allowed permissions vector.
       *
       * @param from - the account eosio::name to authorize
       */
      void reqauth(eosio::name from);

      /**
       * Activate a protocol feature
       *
       * @param feature_digest - hash of the protocol feature to activate.
       */
      void activate(const eosio::checksum256& feature_digest);

      /**
       * Assert that a protocol feature has been activated
       *
       * @param feature_digest - hash of the protocol feature to check for activation.
       */
      void reqactivated(const eosio::checksum256& feature_digest);
   };
   EOSIO_ACTIONS(bios_contract,
                 "eosio"_n,
                 action(onblock),
                 action(newaccount, creator, name, owner, active),
                 action(updateauth, account, permission, parent, auth),
                 action(deleteauth, account, permission),
                 action(linkauth, account, code, type, requirement),
                 action(unlinkauth, account, code, type),
                 action(canceldelay, canceling_auth, trx_id),
                 action(setcode, account, vmtype, vmversion, code),
                 action(setabi, account, abi),
                 action(setpriv, account, is_priv),
                 action(setalimits, account, ram_bytes, net_weight, cpu_weight),
                 action(setprods, schedule),
                 action(setparams, params),
                 action(reqauth, from),
                 action(activate, feature_digest),
                 action(reqactivated, feature_digest))

#if defined(COMPILING_TESTS)
   void activate(eosio::test_chain& chain, const std::vector<eosio::checksum256>& features)
   {
      for (auto& feature : features)
         chain.as("eosio"_n).act<actions::activate>(feature);
      chain.finish_block();
      chain.finish_block();
   }
#endif

}  // namespace bios2
