#include <boot/boot.hpp>

static constexpr eosio::blockchain_parameters blockchain_parameters = {
    .max_block_net_usage = 1024 * 1024,
    .target_block_net_usage_pct = 1000,
    .max_transaction_net_usage = 512 * 1024,
    .base_per_transaction_net_usage = 12,
    .net_usage_leeway = 500,
    .context_free_discount_net_usage_num = 20,
    .context_free_discount_net_usage_den = 100,
    .max_block_cpu_usage = 200000,
    .target_block_cpu_usage_pct = 1000,
    .max_transaction_cpu_usage = 150000,
    .min_transaction_cpu_usage = 100,
    .max_transaction_lifetime = 60 * 60,
    .deferred_trx_expiration_window = 10 * 60,
    .max_transaction_delay = 45 * 24 * 3600,
    .max_inline_action_size = 512 * 24,
    .max_inline_action_depth = 6,
    .max_authority_depth = 5000};

void boot::boot_contract::boot()
{
   eosio::set_blockchain_parameters(blockchain_parameters);
}

EOSIO_ACTION_DISPATCHER(boot::actions)
