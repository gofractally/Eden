# cltester: BIOS and Chain Configuration

cltester comes with multiple bios contracts which support different sets of protocol features.

| Name    | Required Features | Additional Actions |
| ------- | ----------------- | ------------------ |
| `bios`  | `PREACTIVATE_FEATURE` | |
| `bios2` | `PREACTIVATE_FEATURE`, `WTMSIG_BLOCK_SIGNATURES` | `setprods` |
| `bios3` | `PREACTIVATE_FEATURE`, `WTMSIG_BLOCK_SIGNATURES`, `BLOCKCHAIN_PARAMETERS`, `ACTION_RETURN_VALUE`, `CONFIGURABLE_WASM_LIMITS2` | `setprods`, `wasmcfg`, enhanced `setparams` |

cltester always activates `PREACTIVATE_FEATURE`; `bios` can be installed as soon as the chain is created. The other bioses need additional protocol features activated before they can be installed. The `activate` action in `bios` can activate these features. A helper method helps activate these in bulk.

## Activating Protocol Features

bios contract headers include a helper function (`activate`) which activates multiple protocol features.

```c++
#include <bios/bios.hpp>

TEST_CASE("activate")
{
   test_chain chain;

   // Load bios
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios.wasm");

   bios::activate(chain, {
      // Features available in 2.0
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

      // Features added in 3.0
      eosio::feature::blockchain_parameters,
      eosio::feature::action_return_value,
      eosio::feature::get_code_hash,
      eosio::feature::configurable_wasm_limits2,
   });

   // Load bios3
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios3.wasm");

   // Use the chain...
}
```

## Setting Consensus Parameters (bios, bios2)

The `setparams` action sets consensus parameters which are available in nodeos 2.0 and earlier.

```c++
#include <bios/bios.hpp>

TEST_CASE("setparams")
{
   test_chain chain;

   // Load bios
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios.wasm");

   // Allow deeper inline actions. Sets all other parameters to the default.
   chain.as("eosio"_n).act<bios::actions::setparams>(
      blockchain_parameters{
         .max_inline_action_depth = 10});

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

## Setting Consensus Parameters (bios3)

The `setparams` action in `bios3` adds an additional field: `max_action_return_value_size`.

```c++
#include <bios/bios.hpp>
#include <bios3/bios3.hpp>

TEST_CASE("setparams_bios3")
{
   test_chain chain;
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios.wasm");
   bios::activate(chain, {
      eosio::feature::wtmsig_block_signatures,
      eosio::feature::blockchain_parameters,
      eosio::feature::action_return_value,
      eosio::feature::configurable_wasm_limits2,
   });
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios3.wasm");

   // Allow larger return sizes. Sets all other parameters to the default.
   chain.as("eosio"_n).act<bios3::actions::setparams>(
      bios3::blockchain_parameters_v1{
         .max_action_return_value_size = 1024});

   // Use the chain...
}
```

## Expanding WASM limits (bios3)

The `wasmcfg` action in `bios3` expands the WASM limits.

```c++
#include <bios/bios.hpp>
#include <bios3/bios3.hpp>

TEST_CASE("wasmcfg")
{
   test_chain chain;
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios.wasm");
   bios::activate(chain, {
      eosio::feature::wtmsig_block_signatures,
      eosio::feature::blockchain_parameters,
      eosio::feature::action_return_value,
      eosio::feature::configurable_wasm_limits2,
   });
   chain.set_code("eosio"_n, CLSDK_CONTRACTS_DIR "bios3.wasm");

   // low, default (same as low), or high
   chain.as("eosio"_n).act<bios3::actions::wasmcfg>("high"_n);

   // Use the chain...
}
```
