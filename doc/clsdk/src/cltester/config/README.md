# cltester: Chain Configuration

cltester comes with contracts for modifying consensus parameters and for activating protocol features. The headers for these contracts include utilities for installing, using, and uninstalling them.

## Setting Consensus Parameters

The `set_parameters` contract sets consensus parameters. The contract's header file includes a helper function (`setparams`) which loads the contract into the `eosio` account, calls it, then clears the eosio contract.

```c++
#include <set_parameters/set_parameters.hpp>

TEST_CASE("setparams")
{
   test_chain chain;

   // Allow deeper inline actions. Sets all other parameters to the default.
   set_parameters::setparams(chain, {.max_inline_action_depth = 10});

   // Use the chain...
}
```

```eosio::blockchain_parameters``` has the following definition:

```c++
struct blockchain_parameters
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
};
```

## Activating Protocol Features

The `activate_feature` contract activates protocol features. The contract's header file includes a helper function (`activate`) which loads the contract into the `eosio` account, calls it, then clears the eosio contract.

```c++
#include <activate_feature/activate_feature.hpp>

TEST_CASE("activate")
{
   test_chain chain;

   // Activate all 2.0 features
   activate_feature::activate(chain, {
      eosio::feature::only_link_to_existing_permission,
      eosio::feature::forward_setcode,
      eosio::feature::wtmsig_block_signatures,
      eosio::feature::replace_deferred,
      eosio::feature::no_duplicate_deferred_id,
      eosio::feature::ram_restrictions,
      eosio::feature::webauthn_key,
      eosio::feature::disallow_empty_producer_schedule,
      eosio::feature::only_bill_first_authorizer,
      eosio::feature::restrict_action_to_self,
      eosio::feature::fix_linkauth_restriction,
      eosio::feature::get_sender,
   });

   // Use the chain...
}
```
