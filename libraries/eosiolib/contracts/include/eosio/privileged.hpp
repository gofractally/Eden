#pragma once
#include <eosio/crypto.hpp>
#include <eosio/datastream.hpp>
#include <eosio/name.hpp>
#include <eosio/producer_schedule.hpp>
#include <eosio/serialize.hpp>
#include <eosio/system.hpp>

namespace eosio
{
   namespace internal_use_do_not_use
   {
      extern "C"
      {
         [[clang::import_name("is_privileged")]] bool is_privileged(uint64_t account);

         [[clang::import_name("get_resource_limits")]] void get_resource_limits(
             uint64_t account,
             int64_t* ram_bytes,
             int64_t* net_weight,
             int64_t* cpu_weight);

         [[clang::import_name("set_resource_limits")]] void set_resource_limits(uint64_t account,
                                                                                int64_t ram_bytes,
                                                                                int64_t net_weight,
                                                                                int64_t cpu_weight);

         [[clang::import_name("set_privileged")]] void set_privileged(uint64_t account,
                                                                      bool is_priv);

         [[clang::import_name("set_blockchain_parameters_packed")]] void
         set_blockchain_parameters_packed(const char* data, uint32_t datalen);

         [[clang::import_name("get_blockchain_parameters_packed")]] uint32_t
         get_blockchain_parameters_packed(char* data, uint32_t datalen);

         [[clang::import_name("set_proposed_producers")]] int64_t set_proposed_producers(char*,
                                                                                         uint32_t);

         [[clang::import_name("preactivate_feature")]] void preactivate_feature(
             const capi_checksum256* feature_digest);

         [[clang::import_name("set_proposed_producers_ex")]] int64_t set_proposed_producers_ex(
             uint64_t producer_data_format,
             char* producer_data,
             uint32_t producer_data_size);
      }
   }  // namespace internal_use_do_not_use

   namespace feature
   {
      // clang-format off
      static constexpr checksum256 only_link_to_existing_permission = {0x1a, 0x99, 0xa5, 0x9d, 0x87, 0xe0, 0x6e, 0x09, 0xec, 0x5b, 0x02, 0x8a, 0x9c, 0xbb, 0x77, 0x49, 0xb4, 0xa5, 0xad, 0x88, 0x19, 0x00, 0x43, 0x65, 0xd0, 0x2d, 0xc4, 0x37, 0x9a, 0x8b, 0x72, 0x41};
      static constexpr checksum256 forward_setcode                  = {0x26, 0x52, 0xf5, 0xf9, 0x60, 0x06, 0x29, 0x41, 0x09, 0xb3, 0xdd, 0x0b, 0xbd, 0xe6, 0x36, 0x93, 0xf5, 0x53, 0x24, 0xaf, 0x45, 0x2b, 0x79, 0x9e, 0xe1, 0x37, 0xa8, 0x1a, 0x90, 0x5e, 0xed, 0x25};
      static constexpr checksum256 wtmsig_block_signatures          = {0x29, 0x9d, 0xcb, 0x6a, 0xf6, 0x92, 0x32, 0x4b, 0x89, 0x9b, 0x39, 0xf1, 0x6d, 0x5a, 0x53, 0x0a, 0x33, 0x06, 0x28, 0x04, 0xe4, 0x1f, 0x09, 0xdc, 0x97, 0xe9, 0xf1, 0x56, 0xb4, 0x47, 0x67, 0x07};
      static constexpr checksum256 replace_deferred                 = {0xef, 0x43, 0x11, 0x2c, 0x65, 0x43, 0xb8, 0x8d, 0xb2, 0x28, 0x3a, 0x2e, 0x07, 0x72, 0x78, 0xc3, 0x15, 0xae, 0x2c, 0x84, 0x71, 0x9a, 0x8b, 0x25, 0xf2, 0x5c, 0xc8, 0x85, 0x65, 0xfb, 0xea, 0x99};
      static constexpr checksum256 no_duplicate_deferred_id         = {0x4a, 0x90, 0xc0, 0x0d, 0x55, 0x45, 0x4d, 0xc5, 0xb0, 0x59, 0x05, 0x5c, 0xa2, 0x13, 0x57, 0x9c, 0x6e, 0xa8, 0x56, 0x96, 0x77, 0x12, 0xa5, 0x60, 0x17, 0x48, 0x78, 0x86, 0xa4, 0xd4, 0xcc, 0x0f};
      static constexpr checksum256 ram_restrictions                 = {0x4e, 0x7b, 0xf3, 0x48, 0xda, 0x00, 0xa9, 0x45, 0x48, 0x9b, 0x2a, 0x68, 0x17, 0x49, 0xeb, 0x56, 0xf5, 0xde, 0x00, 0xb9, 0x00, 0x01, 0x4e, 0x13, 0x7d, 0xda, 0xe3, 0x9f, 0x48, 0xf6, 0x9d, 0x67};
      static constexpr checksum256 webauthn_key                     = {0x4f, 0xca, 0x8b, 0xd8, 0x2b, 0xbd, 0x18, 0x1e, 0x71, 0x4e, 0x28, 0x3f, 0x83, 0xe1, 0xb4, 0x5d, 0x95, 0xca, 0x5a, 0xf4, 0x0f, 0xb8, 0x9a, 0xd3, 0x97, 0x7b, 0x65, 0x3c, 0x44, 0x8f, 0x78, 0xc2};
      static constexpr checksum256 disallow_empty_producer_schedule = {0x68, 0xdc, 0xaa, 0x34, 0xc0, 0x51, 0x7d, 0x19, 0x66, 0x6e, 0x6b, 0x33, 0xad, 0xd6, 0x73, 0x51, 0xd8, 0xc5, 0xf6, 0x9e, 0x99, 0x9c, 0xa1, 0xe3, 0x79, 0x31, 0xbc, 0x41, 0x0a, 0x29, 0x74, 0x28};
      static constexpr checksum256 only_bill_first_authorizer       = {0x8b, 0xa5, 0x2f, 0xe7, 0xa3, 0x95, 0x6c, 0x5c, 0xd3, 0xa6, 0x56, 0xa3, 0x17, 0x4b, 0x93, 0x1d, 0x3b, 0xb2, 0xab, 0xb4, 0x55, 0x78, 0xbe, 0xfc, 0x59, 0xf2, 0x83, 0xec, 0xd8, 0x16, 0xa4, 0x05};
      static constexpr checksum256 restrict_action_to_self          = {0xad, 0x9e, 0x3d, 0x8f, 0x65, 0x06, 0x87, 0x70, 0x9f, 0xd6, 0x8f, 0x4b, 0x90, 0xb4, 0x1f, 0x7d, 0x82, 0x5a, 0x36, 0x5b, 0x02, 0xc2, 0x3a, 0x63, 0x6c, 0xef, 0x88, 0xac, 0x2a, 0xc0, 0x0c, 0x43};
      static constexpr checksum256 fix_linkauth_restriction         = {0xe0, 0xfb, 0x64, 0xb1, 0x08, 0x5c, 0xc5, 0x53, 0x89, 0x70, 0x15, 0x8d, 0x05, 0xa0, 0x09, 0xc2, 0x4e, 0x27, 0x6f, 0xb9, 0x4e, 0x1a, 0x0b, 0xf6, 0xa5, 0x28, 0xb4, 0x8f, 0xbc, 0x4f, 0xf5, 0x26};
      static constexpr checksum256 get_sender                       = {0xf0, 0xaf, 0x56, 0xd2, 0xc5, 0xa4, 0x8d, 0x60, 0xa4, 0xa5, 0xb5, 0xc9, 0x03, 0xed, 0xfb, 0x7d, 0xb3, 0xa7, 0x36, 0xa9, 0x4e, 0xd5, 0x89, 0xd0, 0xb7, 0x97, 0xdf, 0x33, 0xff, 0x9d, 0x3e, 0x1d};
      // clang-format on
   }  // namespace feature

   /**
    *  @defgroup privileged Privileged
    *  @ingroup contracts
    *  @brief Defines C++ Privileged API
    */

   /**
    *  Tunable blockchain configuration that can be changed via consensus
    *  @ingroup privileged
    */
   struct blockchain_parameters
   {
      constexpr static int percent_1 = 100;  // 1 percent

      /**
       * The maxiumum net usage in instructions for a block
       * @brief the maxiumum net usage in instructions for a block
       */
      uint64_t max_block_net_usage = 1024 * 1024;

      /**
       * The target percent (1% == 100, 100%= 10,000) of maximum net usage; exceeding this triggers
       * congestion handling
       * @brief The target percent (1% == 100, 100%= 10,000) of maximum net usage; exceeding this
       * triggers congestion handling
       */
      uint32_t target_block_net_usage_pct = 10 * percent_1;

      /**
       * The maximum objectively measured net usage that the chain will allow regardless of account
       * limits
       * @brief The maximum objectively measured net usage that the chain will allow regardless of
       * account limits
       */
      uint32_t max_transaction_net_usage = max_block_net_usage / 2;

      /**
       * The base amount of net usage billed for a transaction to cover incidentals
       */
      uint32_t base_per_transaction_net_usage = 12;

      /**
       * The amount of net usage leeway available whilst executing a transaction (still checks
       * against new limits without leeway at the end of the transaction)
       * @brief The amount of net usage leeway available whilst executing a transaction  (still
       * checks against new limits without leeway at the end of the transaction)
       */
      uint32_t net_usage_leeway = 500;

      /**
       * The numerator for the discount on net usage of context-free data
       * @brief The numerator for the discount on net usage of context-free data
       */
      uint32_t context_free_discount_net_usage_num = 20;

      /**
       * The denominator for the discount on net usage of context-free data
       * @brief The denominator for the discount on net usage of context-free data
       */
      uint32_t context_free_discount_net_usage_den = 100;

      /**
       * The maxiumum billable cpu usage (in microseconds) for a block
       * @brief The maxiumum billable cpu usage (in microseconds) for a block
       */
      uint32_t max_block_cpu_usage = 200'000;

      /**
       * The target percent (1% == 100, 100%= 10,000) of maximum cpu usage; exceeding this triggers
       * congestion handling
       * @brief The target percent (1% == 100, 100%= 10,000) of maximum cpu usage; exceeding this
       * triggers congestion handling
       */
      uint32_t target_block_cpu_usage_pct = 10 * percent_1;

      /**
       * The maximum billable cpu usage (in microseconds) that the chain will allow regardless of
       * account limits
       * @brief The maximum billable cpu usage (in microseconds) that the chain will allow
       * regardless of account limits
       */
      uint32_t max_transaction_cpu_usage = 3 * max_block_cpu_usage / 4;

      /**
       * The minimum billable cpu usage (in microseconds) that the chain requires
       * @brief The minimum billable cpu usage (in microseconds) that the chain requires
       */
      uint32_t min_transaction_cpu_usage = 100;

      /**
       * Maximum lifetime of a transacton
       * @brief Maximum lifetime of a transacton
       */
      uint32_t max_transaction_lifetime = 60 * 60;

      /**
       * The number of seconds after the time a deferred transaction can first execute until it
       * expires
       * @brief the number of seconds after the time a deferred transaction can first execute until
       * it expires
       */
      uint32_t deferred_trx_expiration_window = 10 * 60;

      /**
       * The maximum number of seconds that can be imposed as a delay requirement by authorization
       * checks
       * @brief The maximum number of seconds that can be imposed as a delay requirement by
       * authorization checks
       */
      uint32_t max_transaction_delay = 45 * 24 * 3600;

      /**
       * Maximum size of inline action
       * @brief Maximum size of inline action
       */
      uint32_t max_inline_action_size = 512 * 1024;

      /**
       * Maximum depth of inline action
       * @brief Maximum depth of inline action
       */
      uint16_t max_inline_action_depth = 4;

      /**
       * Maximum authority depth
       * @brief Maximum authority depth
       */
      uint16_t max_authority_depth = 6;

      EOSLIB_SERIALIZE(
          blockchain_parameters,
          (max_block_net_usage)(target_block_net_usage_pct)(max_transaction_net_usage)(
              base_per_transaction_net_usage)(net_usage_leeway)(
              context_free_discount_net_usage_num)(context_free_discount_net_usage_den)

              (max_block_cpu_usage)(target_block_cpu_usage_pct)(max_transaction_cpu_usage)(
                  min_transaction_cpu_usage)

                  (max_transaction_lifetime)(deferred_trx_expiration_window)(max_transaction_delay)(
                      max_inline_action_size)(max_inline_action_depth)(max_authority_depth))
   };

   /**
    *  Set the blockchain parameters
    *
    *  @ingroup privileged
    *  @param params - New blockchain parameters to set
    */
   void set_blockchain_parameters(const eosio::blockchain_parameters& params);

   /**
    *  Retrieve the blolckchain parameters
    *
    *  @ingroup privileged
    *  @param params - It will be replaced with the retrieved blockchain params
    */
   void get_blockchain_parameters(eosio::blockchain_parameters& params);

   /**
    *  Get the resource limits of an account
    *
    *  @ingroup privileged
    *  @param account - name of the account whose resource limit to get
    *  @param ram_bytes -  output to hold retrieved ram limit in absolute bytes
    *  @param net_weight - output to hold net limit
    *  @param cpu_weight - output to hold cpu limit
    */
   inline void get_resource_limits(name account,
                                   int64_t& ram_bytes,
                                   int64_t& net_weight,
                                   int64_t& cpu_weight)
   {
      internal_use_do_not_use::get_resource_limits(account.value, &ram_bytes, &net_weight,
                                                   &cpu_weight);
   }

   /**
    *  Set the resource limits of an account
    *
    *  @ingroup privileged
    *  @param account - name of the account whose resource limit to be set
    *  @param ram_bytes - ram limit in absolute bytes
    *  @param net_weight - fractionally proportionate net limit of available resources based on
    * (weight / total_weight_of_all_accounts)
    *  @param cpu_weight - fractionally proportionate cpu limit of available resources based on
    * (weight / total_weight_of_all_accounts)
    */
   inline void set_resource_limits(name account,
                                   int64_t ram_bytes,
                                   int64_t net_weight,
                                   int64_t cpu_weight)
   {
      internal_use_do_not_use::set_resource_limits(account.value, ram_bytes, net_weight,
                                                   cpu_weight);
   }

   /**
    *  Proposes a schedule change using the legacy producer key format
    *
    *  @ingroup privileged
    *  @note Once the block that contains the proposal becomes irreversible, the schedule is
    * promoted to "pending" automatically. Once the block that promotes the schedule is
    * irreversible, the schedule will become "active"
    *  @param producers - vector of producer keys
    *
    *  @return an optional value of the version of the new proposed schedule if successful
    */
   std::optional<uint64_t> set_proposed_producers(const std::vector<producer_key>& prods);

   /**
    *  Proposes a schedule change using the more flexible key format
    *
    *  @ingroup privileged
    *  @note Once the block that contains the proposal becomes irreversible, the schedule is
    * promoted to "pending" automatically. Once the block that promotes the schedule is
    * irreversible, the schedule will become "active"
    *  @param producers - vector of producer authorities
    *
    *  @return an optional value of the version of the new proposed schedule if successful
    */
   inline std::optional<uint64_t> set_proposed_producers(
       const std::vector<producer_authority>& prods)
   {
      auto packed_prods = eosio::pack(prods);
      int64_t ret = internal_use_do_not_use::set_proposed_producers_ex(
          1, (char*)packed_prods.data(), packed_prods.size());
      if (ret >= 0)
         return static_cast<uint64_t>(ret);
      return {};
   }

   /**
    *  Check if an account is privileged
    *
    *  @ingroup privileged
    *  @param account - name of the account to be checked
    *  @return true if the account is privileged
    *  @return false if the account is not privileged
    */
   inline bool is_privileged(name account)
   {
      return internal_use_do_not_use::is_privileged(account.value);
   }

   /**
    *  Set the privileged status of an account
    *
    *  @ingroup privileged
    *  @param account - name of the account whose privileged account to be set
    *  @param is_priv - privileged status
    */
   inline void set_privileged(name account, bool is_priv)
   {
      internal_use_do_not_use::set_privileged(account.value, is_priv);
   }

   /**
    * Pre-activate protocol feature
    *
    * @ingroup privileged
    * @param feature_digest - digest of the protocol feature to pre-activate
    */
   inline void preactivate_feature(const checksum256& feature_digest)
   {
      auto feature_digest_data = feature_digest.extract_as_byte_array();
      internal_use_do_not_use::preactivate_feature(
          reinterpret_cast<const internal_use_do_not_use::capi_checksum256*>(
              feature_digest_data.data()));
   }

}  // namespace eosio
