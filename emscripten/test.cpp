#include <emscripten.h>
#include <stdio.h>
#include <boost/asio/post.hpp>
#include <boost/asio/thread_pool.hpp>
#include <cltestlib/cltestlib.hpp>
#include <fc/exception/exception.hpp>

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
      free(s);
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

void ret(uint32_t promise)
{
   MAIN_THREAD_ASYNC_EM_ASM({ Module.resolvePromise($0, undefined); }, promise);
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

int main()
{
   init_js();
   fc::logger::get(DEFAULT_LOGGER).set_log_level(fc::log_level::debug);
   emscripten_exit_with_live_runtime();
   return 0;
}
