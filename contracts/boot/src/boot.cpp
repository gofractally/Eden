#include <boot/boot.hpp>
#include <eosio/from_json.hpp>

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
    .max_authority_depth = 6};

static const std::vector<std::string> protocol_features{
    "4e7bf348da00a945489b2a681749eb56f5de00b900014e137ddae39f48f69d67"};

void boot::boot_contract::boot()
{
   eosio::set_blockchain_parameters(blockchain_parameters);
   for (const auto& feature : protocol_features)
   {
      std::vector<char> buf;
      buf.push_back('"');
      buf.insert(buf.end(), feature.begin(), feature.end());
      buf.push_back('"');
      buf.push_back('\0');
      eosio::json_token_stream stream(buf.data());
      eosio::preactivate_feature(eosio::from_json<eosio::checksum256>(stream));
   }
}

EOSIO_ACTION_DISPATCHER(boot::actions)
