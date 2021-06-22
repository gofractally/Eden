#pragma once

#include <eosio/chain/controller.hpp>
#include <eosio/chain/protocol_feature_manager.hpp>

namespace cltestlib
{
   eosio::chain::protocol_feature_set make_protocol_feature_set();

   struct push_trx_args
   {
      eosio::chain::bytes transaction;
      std::vector<eosio::chain::bytes> context_free_data;
      std::vector<eosio::chain::signature_type> signatures;
      std::vector<eosio::chain::private_key_type> keys;
   };

   struct test_chain
   {
      static constexpr int block_interval_us = 500'000;
      eosio::chain::private_key_type producer_key{
          std::string{"5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"}};
      std::unique_ptr<eosio::chain::controller::config> cfg;
      std::unique_ptr<eosio::chain::controller> control;

      virtual void mutating() {}
      void start_block(int64_t skip_miliseconds = 0);
      void start_if_needed();
      void finish_block();
      eosio::chain::transaction_trace_ptr push_transaction(
          uint32_t billed_cpu_time_us,
          std::shared_ptr<eosio::chain::packed_transaction> ptrx);
      eosio::chain::transaction_trace_ptr push_transaction(uint32_t billed_cpu_time_us,
                                                           push_trx_args&& args);
      eosio::chain::transaction_trace_ptr exec_deferred(uint32_t billed_cpu_time_us);
   };
}  // namespace cltestlib

FC_REFLECT(cltestlib::push_trx_args, (transaction)(context_free_data)(signatures)(keys))
