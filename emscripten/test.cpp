#include <emscripten.h>
#include <stdio.h>
#include <boost/asio/post.hpp>
#include <boost/asio/thread_pool.hpp>
#include <cltestlib/cltestlib.hpp>
#include <eosio/chain/resource_limits.hpp>
#include <fc/exception/exception.hpp>
#include <fc/io/json.hpp>

// JS function calls come in on the main thread then execute in the background thread. This
// * Stops chainlib from hitting browser restrictions that only apply to the main thread
// * Stops long chainlib operations from blocking the main thread
//
// The JS interface wraps this up with promises
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
      getRawAbi(account)  // eosjs JsonRpc
      {
         return Module.withPromise(p => Module._schedule_get_raw_abi(p, this.index, account));
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
      eosio::chain::controller::config cfg;
      cfg.blocks_dir = dir.path() / "blocks";
      cfg.state_dir = dir.path() / "state";
      cfg.contracts_console = true;
      cfg.state_size = 200 * 1024 * 1024;
      cfg.state_guard_size = 0;

      eosio::chain::genesis_state genesis;
      genesis.initial_timestamp = fc::time_point::from_iso_string("2020-01-01T00:00:00.000");

      control = std::make_unique<eosio::chain::controller>(
          cfg, cltestlib::make_protocol_feature_set(), genesis.compute_chain_id());
      control->add_indices();
      control->startup([] { return false; }, genesis);
      control->start_block(control->head_block_time() + fc::microseconds(block_interval_us), 0,
                           {*control->get_protocol_feature_manager().get_builtin_digest(
                               eosio::chain::builtin_protocol_feature_t::preactivate_feature)});
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
   eosio::chain::chain_id_type chain_id;
   uint32_t head_block_num = 0;
   uint32_t last_irreversible_block_num = 0;
   eosio::chain::block_id_type last_irreversible_block_id;
   eosio::chain::block_id_type head_block_id;
   fc::time_point head_block_time;
   eosio::chain::name head_block_producer;
   uint64_t virtual_block_cpu_limit = 0;
   uint64_t virtual_block_net_limit = 0;
   uint64_t block_cpu_limit = 0;
   uint64_t block_net_limit = 0;
   uint32_t fork_db_head_block_num = 0;
   eosio::chain::block_id_type fork_db_head_block_id;
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

extern "C" void EMSCRIPTEN_KEEPALIVE schedule_get_raw_abi(uint32_t promise,
                                                          uint32_t index,
                                                          const std::string& account)
{
   run_in_background(promise, [=] {
      const auto& chain = assert_chain(index);
      const auto& abi = chain.control->get_account(eosio::chain::name(account)).abi;
      char* copy = (char*)malloc(abi.size());
      if (!copy)
         throw std::bad_alloc();
      memcpy(copy, abi.data(), abi.size());
      MAIN_THREAD_ASYNC_EM_ASM(
          {  //
             Module.removePromise($0).accept(Module.eatBuffer($1, $2));
          },
          promise, copy, abi.size());
      ret(promise);
   });
}

int main()
{
   init_js();
   fc::logger::get(DEFAULT_LOGGER).set_log_level(fc::log_level::debug);
   emscripten_exit_with_live_runtime();
   return 0;
}
