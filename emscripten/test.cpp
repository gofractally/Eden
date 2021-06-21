#include <emscripten.h>
#include <stdio.h>
#include <boost/asio/post.hpp>
#include <boost/asio/thread_pool.hpp>
#include <cltestlib/cltestlib.hpp>
#include <eosio/chain/abi_serializer.hpp>
#include <eosio/chain/authorization_manager.hpp>
#include <eosio/chain/resource_limits.hpp>
#include <fc/exception/exception.hpp>
#include <fc/io/json.hpp>

using namespace std::literals;

using boost::container::flat_set;
using eosio::chain::abi_def;
using eosio::chain::abi_serializer;
using eosio::chain::account_object;
using eosio::chain::block_id_type;
using eosio::chain::builtin_protocol_feature_t;
using eosio::chain::by_name;
using eosio::chain::chain_id_type;
using eosio::chain::controller;
using eosio::chain::genesis_state;
using eosio::chain::name;
using eosio::chain::public_key_type;
using eosio::chain::signed_block_ptr;
using eosio::chain::transaction;
using eosio::chain::transaction_type_exception;
using eosio::chain::unknown_block_exception;

// JS function calls come in on the main thread then execute in the background thread. This
// * Stops chainlib from hitting browser restrictions that only apply to the main thread
// * Stops long chainlib operations from blocking the main thread
boost::asio::thread_pool background(1);

// clang-format off
EM_JS(void, init_js, (), {
   // TODO: reuse entries in Module.promises
   Module.promises = [];
   Module.eatString = s =>
   {
      let result = UTF8ToString(s);
      _free(s);
      return result;
   };
   Module.eatBuffer = (data, size) =>
   {
      let result = new Uint8Array(GROWABLE_HEAP_U8().subarray(data, data + size));
      _free(data);
      return result;
   };
   Module.createPromise = () =>
   {
      let index = Module.promises.length;
      let promise = new Promise((resolve, reject) => {  //
         Module.promises.push({resolve, reject});
      });
      return {promise, index};
   };
   Module.removePromise = index =>
   {
      let result = Module.promises[index];
      Module.promises[index] = null;
      return result;
   };
   Module.resolvePromise = (index, result) =>
   {  //
      Module.removePromise(index).resolve(result);
   };
   Module.withPromise = f =>
   {
      let{promise, index} = Module.createPromise();
      f(index);
      return promise;
   };

   class Chain
   {
      constructor(index) { this.index = index; }
      destroy() { return Module.withPromise(p => Module._schedule_destroy_chain(p, this.index)); }
      startBlock(ms)
      {
         return Module.withPromise(p => Module._schedule_start_block(p, this.index, ms));
      }
      finishBlock()
      {
         return Module.withPromise(p => Module._schedule_finish_block(p, this.index));
      }
      get_info()  // eosjs JsonRpc
      {
         return Module.withPromise(p => Module._schedule_get_info(p, this.index));
      }
      get_block(b)  // eosjs JsonRpc
      {
         return Module.withPromise(p => ccall("schedule_get_block", null,
                                               [ "number", "number", "string" ],
                                               [ p, this.index, b + "" ]));
      }
      async getRawAbi(account)  // eosjs JsonRpc
      {
         const abi = await Module.withPromise(p => ccall("schedule_get_raw_abi", null,
                                                          [ "number", "number", "string" ],
                                                          [ p, this.index, account + "" ]));
         return {accountName : account, abi};
      }
      async getRequiredKeys(params)  // eosjs JsonRpc
      {
         const json = JSON.stringify(
             {transaction : params.transaction, available_keys : params.availableKeys});
         return await Module.withPromise(p => ccall("schedule_get_required_keys", null,
                                                     [ "number", "number", "string" ],
                                                     [ p, this.index, json ]));
      }
   };
   Module.Chain = Chain;
   Module.createChain = () =>
   {
      return Module.withPromise(p => Module._schedule_create_chain(p));
   };
});  // init_js
// clang-format on

void send_error(uint32_t promise, const char* e)
{
   auto copy = strdup(e);
   if (!copy)
      abort();
   MAIN_THREAD_ASYNC_EM_ASM(
       {  //
          Module.removePromise($0).reject(new Error(Module.eatString($1)));
       },
       promise, copy);
}

void ret(uint32_t promise)
{
   MAIN_THREAD_ASYNC_EM_ASM({ Module.resolvePromise($0, undefined); }, promise);
}

void ret(uint32_t promise, const char* s)
{
   auto copy = strdup(s);
   if (!copy)
      throw std::bad_alloc();
   MAIN_THREAD_ASYNC_EM_ASM(
       {  //
          Module.resolvePromise($0, Module.eatString($1));
       },
       promise, copy);
}

void ret_json(uint32_t promise, const char* s)
{
   auto copy = strdup(s);
   if (!copy)
      throw std::bad_alloc();
   MAIN_THREAD_ASYNC_EM_ASM(
       {  //
          Module.resolvePromise($0, JSON.parse(Module.eatString($1)));
       },
       promise, copy);
}

void ret_blob(uint32_t promise, const void* data, size_t size)
{
   char* copy = (char*)malloc(size);
   if (!copy)
      throw std::bad_alloc();
   memcpy(copy, data, size);
   MAIN_THREAD_ASYNC_EM_ASM(
       {  //
          Module.removePromise($0).resolve(Module.eatBuffer($1, $2));
       },
       promise, copy, size);
}

template <typename F>
void run_in_background(uint32_t promise, F f)
{
   boost::asio::post(background, [=] {
      try
      {
         f();
      }
      catch (fc::exception& e)
      {
         elog("${e}\n", ("e", e));
         send_error(promise, e.to_string().c_str());
      }
      catch (std::exception& e)
      {
         elog("${e}\n", ("e", e.what()));
         send_error(promise, e.what());
      }
      catch (...)
      {
         elog("unknown exception\n");
         send_error(promise, "unknown exception");
      }
   });
}

struct test_chain : cltestlib::test_chain
{
   fc::temp_directory dir;

   test_chain()
   {
      controller::config cfg;
      cfg.blocks_dir = dir.path() / "blocks";
      cfg.state_dir = dir.path() / "state";
      cfg.contracts_console = true;
      cfg.state_size = 200 * 1024 * 1024;
      cfg.state_guard_size = 0;

      genesis_state genesis;
      genesis.initial_timestamp = fc::time_point::from_iso_string("2020-01-01T00:00:00.000");

      control = std::make_unique<controller>(cfg, cltestlib::make_protocol_feature_set(),
                                             genesis.compute_chain_id());
      control->add_indices();
      control->startup([] { return false; }, genesis);
      control->start_block(control->head_block_time() + fc::microseconds(block_interval_us), 0,
                           {*control->get_protocol_feature_manager().get_builtin_digest(
                               builtin_protocol_feature_t::preactivate_feature)});
   }
};

std::vector<std::unique_ptr<test_chain>> chains;

test_chain& assert_chain(uint32_t index)
{
   if (index >= chains.size() || !chains[index])
      throw std::runtime_error("unknown or destroyed chain");
   return *chains[index];
}

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_create_chain(uint32_t promise)
{
   run_in_background(promise, [=] {
      auto result = chains.size();
      chains.push_back(std::make_unique<test_chain>());
      MAIN_THREAD_ASYNC_EM_ASM(
          {  //
             Module.resolvePromise($0, new Module.Chain($1));
          },
          promise, result);
   });
}

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_destroy_chain(uint32_t promise, uint32_t index)
{
   run_in_background(promise, [=] {
      assert_chain(index);
      chains[index] = nullptr;
      ret(promise);
   });
}

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_start_block(uint32_t promise,
                                                          uint32_t index,
                                                          double skip_miliseconds)
{
   run_in_background(promise, [=] {
      assert_chain(index).start_block(skip_miliseconds);
      ret(promise);
   });
}

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_finish_block(uint32_t promise, uint32_t index)
{
   run_in_background(promise, [=] {
      assert_chain(index).finish_block();
      ret(promise);
   });
}

struct get_info_results
{
   chain_id_type chain_id;
   uint32_t head_block_num = 0;
   uint32_t last_irreversible_block_num = 0;
   block_id_type last_irreversible_block_id;
   block_id_type head_block_id;
   fc::time_point head_block_time;
   name head_block_producer;
   uint64_t virtual_block_cpu_limit = 0;
   uint64_t virtual_block_net_limit = 0;
   uint64_t block_cpu_limit = 0;
   uint64_t block_net_limit = 0;
   uint32_t fork_db_head_block_num = 0;
   block_id_type fork_db_head_block_id;
};
FC_REFLECT(get_info_results,
           (chain_id)(head_block_num)(last_irreversible_block_num)(last_irreversible_block_id)(
               head_block_id)(head_block_time)(head_block_producer)(virtual_block_cpu_limit)(
               virtual_block_net_limit)(block_cpu_limit)(block_net_limit)(fork_db_head_block_num)(
               fork_db_head_block_id))

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_get_info(uint32_t promise, uint32_t index)
{
   run_in_background(promise, [=] {
      auto& chain = assert_chain(index);
      auto& control = *chain.control;
      const auto& rm = control.get_resource_limits_manager();
      get_info_results results{
          control.get_chain_id(),
          control.head_block_num(),
          control.last_irreversible_block_num(),
          control.last_irreversible_block_id(),
          control.head_block_id(),
          control.head_block_time(),
          control.head_block_producer(),
          rm.get_virtual_block_cpu_limit(),
          rm.get_virtual_block_net_limit(),
          rm.get_block_cpu_limit(),
          rm.get_block_net_limit(),
          control.fork_db_pending_head_block_num(),
          control.fork_db_pending_head_block_id(),
      };
      ret_json(promise, fc::json::to_string(results, fc::time_point::maximum()).c_str());
   });
}

template <typename Y>
auto make_resolver(controller& control, Y& yield)
{
   return [&](name account) -> fc::optional<abi_serializer> {
      if (const auto* accnt = control.db().find<account_object, by_name>(account))
      {
         abi_def abi;
         if (abi_serializer::to_abi(accnt->abi, abi))
            return abi_serializer(abi, yield);
      }
      return {};
   };
}

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_get_block(uint32_t promise,
                                                        uint32_t index,
                                                        const char* block_num_or_id)
{
   run_in_background(promise, [=] {
      auto& chain = assert_chain(index);
      auto& control = *chain.control;
      signed_block_ptr block;
      try
      {
         block = control.fetch_block_by_number(fc::to_uint64(block_num_or_id));
      }
      catch (...)
      {
         block = control.fetch_block_by_id(fc::variant(block_num_or_id).as<block_id_type>());
      }
      EOS_ASSERT(block, unknown_block_exception, "Could not find block: ${block}",
                 ("block", block_num_or_id));
      fc::variant pretty_output;
      auto yield = abi_serializer::create_yield_function(fc::microseconds::maximum());
      abi_serializer::to_variant(*block, pretty_output, make_resolver(control, yield), yield);
      uint32_t ref_block_prefix = block->id()._hash[1];
      auto result = fc::mutable_variant_object(pretty_output.get_object())  //
          ("id", block->id())                                               //
          ("block_num", block->block_num())                                 //
          ("ref_block_prefix", ref_block_prefix);
      ret_json(promise, fc::json::to_string(result, fc::time_point::maximum()).c_str());
   });
}

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_get_raw_abi(uint32_t promise,
                                                          uint32_t index,
                                                          const char* account)
{
   run_in_background(promise, [=] {
      const auto& chain = assert_chain(index);
      const auto& abi = chain.control->get_account(name(account)).abi;
      ret_blob(promise, abi.data(), abi.size());
   });
}

struct get_required_keys_params
{
   fc::variant transaction;
   flat_set<public_key_type> available_keys;
};
FC_REFLECT(get_required_keys_params, (transaction)(available_keys))

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_get_required_keys(uint32_t promise,
                                                                uint32_t index,
                                                                const char* json)
{
   run_in_background(promise, [=] {
      const auto& chain = assert_chain(index);
      auto params = fc::json::from_string(json).as<get_required_keys_params>();
      transaction trx;
      auto yield = abi_serializer::create_yield_function(fc::microseconds::maximum());
      auto resolver = make_resolver(*chain.control, yield);
      try
      {
         abi_serializer::from_variant(params.transaction, trx, resolver, yield);
      }
      EOS_RETHROW_EXCEPTIONS(transaction_type_exception, "Invalid transaction")
      auto required_keys = chain.control->get_authorization_manager().get_required_keys(
          trx, params.available_keys, fc::seconds(trx.delay_sec));
      std::string result = "[";
      bool need_comma = false;
      for (auto& key : required_keys)
      {
         auto str =
             fc::crypto::config::public_key_base_prefix + "_"s +
             key._storage.visit(
                 fc::crypto::base58str_visitor<decltype(key._storage),
                                               fc::crypto::config::public_key_prefix, -1>({}));
         if (need_comma)
            result += ",";
         result += "\"" + str + "\"";
      }
      result += "]";
      ret_json(promise, result.c_str());
      return result;
   });
}

int main()
{
   init_js();
   fc::logger::get(DEFAULT_LOGGER).set_log_level(fc::log_level::debug);
   emscripten_exit_with_live_runtime();
   return 0;
}
