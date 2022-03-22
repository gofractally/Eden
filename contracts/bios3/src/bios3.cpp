#include <bios3/bios3.hpp>
#include <eosio/abi_generator.hpp>

namespace bios3
{
   void bios_contract::setabi(eosio::name account, const eosio::bytes& abi)
   {
      abi_hash_table table(get_self(), get_self().value);
      auto itr = table.find(account.value);
      if (itr == table.end())
      {
         table.emplace(account, [&](auto& row) {
            row.owner = account;
            row.hash = eosio::sha256(const_cast<char*>(abi.data.data()), abi.data.size());
         });
      }
      else
      {
         table.modify(itr, eosio::same_payer, [&](auto& row) {
            row.hash = eosio::sha256(const_cast<char*>(abi.data.data()), abi.data.size());
         });
      }
   }

   void bios_contract::setpriv(eosio::name account, bool is_priv)
   {
      require_auth(get_self());
      set_privileged(account, is_priv);
   }

   void bios_contract::setalimits(eosio::name account,
                                  int64_t ram_bytes,
                                  int64_t net_weight,
                                  int64_t cpu_weight)
   {
      require_auth(get_self());
      set_resource_limits(account, ram_bytes, net_weight, cpu_weight);
   }

   void bios_contract::setprods(const std::vector<eosio::producer_authority>& schedule)
   {
      require_auth(get_self());
      set_proposed_producers(schedule);
   }

   [[clang::import_name("set_parameters_packed")]] void set_parameters_packed(const void*, size_t);

   void bios_contract::setparams(const blockchain_parameters_v1& params)
   {
      require_auth(get_self());

      constexpr size_t param_count = 18;
      // an upper bound on the serialized size
      char buf[1 + sizeof(params) + param_count];
      eosio::datastream<char*> stream(buf, sizeof(buf));

      stream << uint8_t(18);
      stream << uint8_t(0) << params.max_block_net_usage                  //
             << uint8_t(1) << params.target_block_net_usage_pct           //
             << uint8_t(2) << params.max_transaction_net_usage            //
             << uint8_t(3) << params.base_per_transaction_net_usage       //
             << uint8_t(4) << params.net_usage_leeway                     //
             << uint8_t(5) << params.context_free_discount_net_usage_num  //
             << uint8_t(6) << params.context_free_discount_net_usage_den  //
             << uint8_t(7) << params.max_block_cpu_usage                  //
             << uint8_t(8) << params.target_block_cpu_usage_pct           //
             << uint8_t(9) << params.max_transaction_cpu_usage            //
             << uint8_t(10) << params.min_transaction_cpu_usage           //
             << uint8_t(11) << params.max_transaction_lifetime            //
             << uint8_t(12) << params.deferred_trx_expiration_window      //
             << uint8_t(13) << params.max_transaction_delay               //
             << uint8_t(14) << params.max_inline_action_size              //
             << uint8_t(15) << params.max_inline_action_depth             //
             << uint8_t(16) << params.max_authority_depth                 //
             << uint8_t(17) << params.max_action_return_value_size;

      set_parameters_packed(buf, stream.tellp());
   }

   // The limits on contract webassembly modules
   struct wasm_parameters
   {
      uint32_t max_mutable_global_bytes;
      uint32_t max_table_elements;
      uint32_t max_section_elements;
      uint32_t max_linear_memory_init;
      uint32_t max_func_local_bytes;
      uint32_t max_nested_structures;
      uint32_t max_symbol_bytes;
      uint32_t max_module_bytes;
      uint32_t max_code_bytes;
      uint32_t max_pages;
      uint32_t max_call_depth;
   };

   static constexpr wasm_parameters default_limits = {.max_mutable_global_bytes = 1024,
                                                      .max_table_elements = 1024,
                                                      .max_section_elements = 8192,
                                                      .max_linear_memory_init = 64 * 1024,
                                                      .max_func_local_bytes = 8192,
                                                      .max_nested_structures = 1024,
                                                      .max_symbol_bytes = 8192,
                                                      .max_module_bytes = 20 * 1024 * 1024,
                                                      .max_code_bytes = 20 * 1024 * 1024,
                                                      .max_pages = 528,
                                                      .max_call_depth = 251};

   static constexpr wasm_parameters high_limits = {.max_mutable_global_bytes = 8192,
                                                   .max_table_elements = 8192,
                                                   .max_section_elements = 8192,
                                                   .max_linear_memory_init = 16 * 64 * 1024,
                                                   .max_func_local_bytes = 8192,
                                                   .max_nested_structures = 1024,
                                                   .max_symbol_bytes = 8192,
                                                   .max_module_bytes = 20 * 1024 * 1024,
                                                   .max_code_bytes = 20 * 1024 * 1024,
                                                   .max_pages = 528,
                                                   .max_call_depth = 251};

   [[clang::import_name("set_wasm_parameters_packed")]] void set_wasm_parameters_packed(const void*,
                                                                                        size_t);

   void set_wasm_parameters(const wasm_parameters& params)
   {
      char buf[sizeof(uint32_t) + sizeof(params)] = {};
      memcpy(buf + sizeof(uint32_t), &params, sizeof(params));
      set_wasm_parameters_packed(buf, sizeof(buf));
   }

   void bios_contract::wasmcfg(eosio::name settings)
   {
      require_auth(get_self());
      if (settings == "default"_n || settings == "low"_n)
         set_wasm_parameters(default_limits);
      else if (settings == "high"_n)
         set_wasm_parameters(high_limits);
      else
         eosio::check(false, "Unkown configuration");
   }

   void bios_contract::reqauth(eosio::name from) { require_auth(from); }

   void bios_contract::activate(const eosio::checksum256& feature_digest)
   {
      require_auth(get_self());
      preactivate_feature(feature_digest);
   }

   void bios_contract::reqactivated(const eosio::checksum256& feature_digest)
   {
      eosio::check(eosio::is_feature_activated(feature_digest),
                   "protocol feature is not activated");
   }
}  // namespace bios3

EOSIO_ACTION_DISPATCHER(bios3::actions)
EOSIO_ABIGEN(actions(bios3::actions), table("abihash"_n, bios3::abi_hash))
