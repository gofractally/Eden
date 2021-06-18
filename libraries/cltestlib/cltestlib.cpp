#include <cltestlib/cltestlib.hpp>

#include <eosio/chain/exceptions.hpp>
#include <eosio/chain/generated_transaction_object.hpp>

using eosio::chain::builtin_protocol_feature_t;
using eosio::chain::digest_type;
using eosio::chain::protocol_feature_exception;
using eosio::chain::protocol_feature_set;

namespace cltestlib
{
   eosio::chain::protocol_feature_set make_protocol_feature_set()
   {
      protocol_feature_set pfs;
      std::map<builtin_protocol_feature_t, std::optional<digest_type>> visited_builtins;

      std::function<digest_type(builtin_protocol_feature_t)> add_builtins =
          [&pfs, &visited_builtins,
           &add_builtins](builtin_protocol_feature_t codename) -> digest_type {
         auto res = visited_builtins.emplace(codename, std::optional<digest_type>());
         if (!res.second)
         {
            EOS_ASSERT(res.first->second, protocol_feature_exception,
                       "invariant failure: cycle found in builtin protocol feature dependencies");
            return *res.first->second;
         }

         auto f = protocol_feature_set::make_default_builtin_protocol_feature(
             codename, [&add_builtins](builtin_protocol_feature_t d) { return add_builtins(d); });

         const auto& pf = pfs.add_feature(f);
         res.first->second = pf.feature_digest;

         return pf.feature_digest;
      };

      for (const auto& p : eosio::chain::builtin_protocol_feature_codenames)
      {
         add_builtins(p.first);
      }

      return pfs;
   }

   void test_chain::start_block(int64_t skip_miliseconds)
   {
      mutating();
      if (control->is_building_block())
         finish_block();
      control->start_block(control->head_block_time() +
                               fc::microseconds(skip_miliseconds * 1000ll + block_interval_us),
                           0);
   }

   void test_chain::start_if_needed()
   {
      mutating();
      if (!control->is_building_block())
         control->start_block(control->head_block_time() + fc::microseconds(block_interval_us), 0);
   }

   void test_chain::finish_block()
   {
      start_if_needed();
      ilog("finish block ${n}", ("n", control->head_block_num()));
      control->finalize_block(
          [&](eosio::chain::digest_type d) { return std::vector{producer_key.sign(d)}; });
      control->commit_block();
   }

   eosio::chain::transaction_trace_ptr test_chain::push_transaction(uint32_t billed_cpu_time_us,
                                                                    push_trx_args&& args)
   {
      auto transaction = fc::raw::unpack<eosio::chain::transaction>(args.transaction);
      eosio::chain::signed_transaction signed_trx{
          std::move(transaction), std::move(args.signatures), std::move(args.context_free_data)};
      start_if_needed();
      for (auto& key : args.keys)
         signed_trx.sign(key, control->get_chain_id());
      auto ptrx = std::make_shared<eosio::chain::packed_transaction>(
          std::move(signed_trx), eosio::chain::packed_transaction::compression_type::none);
      auto fut = eosio::chain::transaction_metadata::start_recover_keys(
          ptrx, control->get_thread_pool(), control->get_chain_id(), fc::microseconds::maximum());
      auto start_time = std::chrono::steady_clock::now();
      auto result = control->push_transaction(fut.get(), fc::time_point::maximum(),
                                              billed_cpu_time_us, true, billed_cpu_time_us);
      auto us = std::chrono::duration_cast<std::chrono::microseconds>(
          std::chrono::steady_clock::now() - start_time);
      ilog("chainlib transaction took ${u} us", ("u", us.count()));
      return result;
   }

   eosio::chain::transaction_trace_ptr test_chain::exec_deferred(uint32_t billed_cpu_time_us)
   {
      start_if_needed();
      const auto& idx =
          control->db()
              .get_index<eosio::chain::generated_transaction_multi_index, eosio::chain::by_delay>();
      auto itr = idx.begin();
      if (itr != idx.end() && itr->delay_until <= control->pending_block_time())
         return control->push_scheduled_transaction(itr->trx_id, fc::time_point::maximum(),
                                                    billed_cpu_time_us, true);
      return nullptr;
   }

}  // namespace cltestlib
