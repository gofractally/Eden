#pragma once

#include <eosio/bytes.hpp>
#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/privileged.hpp>

#if defined(COMPILING_TESTS)
#include <eosio/tester.hpp>
#endif

namespace bios3
{
   struct abi_hash
   {
      eosio::name owner;
      eosio::checksum256 hash;

      uint64_t primary_key() const { return owner.value; }
   };
   EOSIO_REFLECT(abi_hash, owner, hash)

   typedef eosio::multi_index<"abihash"_n, abi_hash> abi_hash_table;

   struct blockchain_parameters_v1
   {
      constexpr static int percent_1 = 100;  // 1 percent

      uint64_t max_block_net_usage = 1024 * 1024;
      uint32_t target_block_net_usage_pct = 10 * percent_1;
      uint32_t max_transaction_net_usage = max_block_net_usage / 2;
      uint32_t base_per_transaction_net_usage = 12;
      uint32_t net_usage_leeway = 500;
      uint32_t context_free_discount_net_usage_num = 20;
      uint32_t context_free_discount_net_usage_den = 100;
      uint32_t max_block_cpu_usage = 200'000;
      uint32_t target_block_cpu_usage_pct = 10 * percent_1;
      uint32_t max_transaction_cpu_usage = 3 * max_block_cpu_usage / 4;
      uint32_t min_transaction_cpu_usage = 100;
      uint32_t max_transaction_lifetime = 60 * 60;
      uint32_t deferred_trx_expiration_window = 10 * 60;
      uint32_t max_transaction_delay = 45 * 24 * 3600;
      uint32_t max_inline_action_size = 512 * 1024;
      uint16_t max_inline_action_depth = 4;
      uint16_t max_authority_depth = 6;
      uint32_t max_action_return_value_size = 256;
   };
   EOSIO_REFLECT(blockchain_parameters_v1,
                 max_block_net_usage,
                 target_block_net_usage_pct,
                 max_transaction_net_usage,
                 base_per_transaction_net_usage,
                 net_usage_leeway,
                 context_free_discount_net_usage_num,
                 context_free_discount_net_usage_den,
                 max_block_cpu_usage,
                 target_block_cpu_usage_pct,
                 max_transaction_cpu_usage,
                 min_transaction_cpu_usage,
                 max_transaction_lifetime,
                 deferred_trx_expiration_window,
                 max_transaction_delay,
                 max_inline_action_size,
                 max_inline_action_depth,
                 max_authority_depth,
                 max_action_return_value_size)

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
      void setparams(const blockchain_parameters_v1& params);

      /**
       * Sets the webassembly limits.  Valid parameters are "low",
       * "default" (equivalent to low), and "high".  A value of "high"
       * allows larger contracts to be deployed.
       */
      void wasmcfg(eosio::name settings);

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
                 action(wasmcfg, settings),
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

}  // namespace bios3
