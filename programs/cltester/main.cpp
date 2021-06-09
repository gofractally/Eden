#include "debug-eos-vm.hpp"

#undef LIKELY
#undef UNLIKELY
#define EOSIO_EOS_VM_JIT_RUNTIME_ENABLED

#include <eosio/chain/apply_context.hpp>
#include <eosio/chain/controller.hpp>
#include <eosio/chain/generated_transaction_object.hpp>
#include <eosio/chain/transaction_context.hpp>
#include <eosio/chain/types.hpp>
#include <eosio/chain/wasm_interface_private.hpp>
#include <eosio/chain/webassembly/interface.hpp>
#include <eosio/chain/webassembly/runtime_interface.hpp>
#include <eosio/state_history/create_deltas.hpp>
#include <eosio/state_history/serialization.hpp>
#include <eosio/state_history/trace_converter.hpp>
#include <fc/crypto/ripemd160.hpp>
#include <fc/crypto/sha1.hpp>
#include <fc/crypto/sha256.hpp>
#include <fc/crypto/sha512.hpp>
#include <fc/exception/exception.hpp>

#undef N

#include <b1/rodeos/embedded_rodeos.hpp>
#include <eosio/chain_types.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/ship_protocol.hpp>
#include <eosio/to_bin.hpp>

#include <stdio.h>
#include <chrono>
#include <optional>

using namespace std::literals;

using boost::signals2::scoped_connection;
using eosio::convert_to_bin;
using eosio::chain::block_state_ptr;
using eosio::chain::builtin_protocol_feature_t;
using eosio::chain::digest_type;
using eosio::chain::protocol_feature_exception;
using eosio::chain::protocol_feature_set;
using eosio::chain::signed_transaction;
using eosio::chain::transaction_trace_ptr;
using eosio::state_history::block_position;
using eosio::state_history::create_deltas;
using eosio::state_history::get_blocks_result_v0;
using eosio::state_history::state_result;
using eosio::vm::span;

struct callbacks;
using rhf_t = eosio::vm::registered_host_functions<callbacks>;

void backtrace();

DEBUG_PARSE_CODE_SECTION(eosio::chain::eos_vm_host_functions_t, eosio::vm::default_options)
using debug_contract_backend = eosio::vm::backend<eosio::chain::eos_vm_host_functions_t,
                                                  eosio::vm::jit_profile,
                                                  eosio::vm::default_options,
                                                  debug_eos_vm::debug_instr_map>;

template <>
void eosio::vm::machine_code_writer<
    eosio::vm::jit_execution_context<callbacks, true>>::on_unreachable()
{
   backtrace();
   eosio::vm::throw_<wasm_interpreter_exception>("unreachable");
}

DEBUG_PARSE_CODE_SECTION(rhf_t, eosio::vm::default_options)
using backend_t = eosio::vm::backend<  //
    rhf_t,
    eosio::vm::jit_profile,
    eosio::vm::default_options,
    debug_eos_vm::debug_instr_map>;

inline constexpr int max_backtrace_frames = 512;

inline constexpr int block_interval_ms = 500;
inline constexpr int block_interval_us = block_interval_ms * 1000;
inline constexpr uint32_t billed_cpu_time_use = 2000;

inline constexpr int32_t polyfill_root_dir_fd = 3;

inline constexpr uint16_t wasi_errno_badf = 8;
inline constexpr uint16_t wasi_errno_inval = 28;
inline constexpr uint16_t wasi_errno_io = 29;
inline constexpr uint16_t wasi_errno_noent = 44;

inline constexpr uint8_t wasi_filetype_character_device = 2;
inline constexpr uint8_t wasi_filetype_directory = 3;
inline constexpr uint8_t wasi_filetype_regular_file = 4;

inline constexpr uint64_t wasi_rights_fd_read = 2;
inline constexpr uint64_t wasi_rights_fd_write = 64;

inline constexpr uint16_t wasi_oflags_creat = 1;
inline constexpr uint16_t wasi_oflags_directory = 2;
inline constexpr uint16_t wasi_oflags_excl = 4;
inline constexpr uint16_t wasi_oflags_trunc = 8;

inline constexpr uint16_t wasi_fdflags_append = 1;
inline constexpr uint16_t wasi_fdflags_dsync = 2;
inline constexpr uint16_t wasi_fdflags_nonblock = 4;
inline constexpr uint16_t wasi_fdflags_rsync = 8;
inline constexpr uint16_t wasi_fdflags_sync = 1;

// Handle eosio version differences
namespace
{
   template <typename T>
   auto to_uint64_t(T n)
       -> std::enable_if_t<std::is_same_v<T, eosio::chain::name>, decltype(n.value)>
   {
      return n.value;
   }
   template <typename T>
   auto to_uint64_t(T n)
       -> std::enable_if_t<std::is_same_v<T, eosio::chain::name>, decltype(n.to_uint64_t())>
   {
      return n.to_uint64_t();
   }

   template <typename C, typename F0, typename F1, typename G>
   auto do_startup(C&& control, F0&&, F1&& f1, G &&)
       -> std::enable_if_t<std::is_constructible_v<std::decay_t<decltype(*control)>,
                                                   eosio::chain::controller::config,
                                                   protocol_feature_set>>
   {
      return control->startup([]() { return false; }, nullptr);
   }
   template <typename C, typename F0, typename F1, typename G>
   auto do_startup(C&& control, F0&&, F1&& f1, G&& genesis)
       -> decltype(control->startup(f1, genesis))
   {
      return control->startup([]() { return false; }, genesis);
   }
   template <typename C, typename F0, typename F1, typename G>
   auto do_startup(C&& control, F0&& f0, F1&& f1, G&& genesis)
       -> decltype(control->startup(f0, f1, genesis))
   {
      return control->startup(f0, f1, genesis);
   }
}  // namespace

struct assert_exception : std::exception
{
   std::string msg;

   assert_exception(std::string&& msg) : msg(std::move(msg)) {}

   const char* what() const noexcept override { return msg.c_str(); }
};

struct file;
struct test_chain;
struct test_rodeos;

struct cached_debugging_module
{
   std::unique_ptr<debug_contract_backend> module;
   std::shared_ptr<dwarf::debugger_registration> reg;
};

struct state
{
   const char* wasm;
   dwarf::info& dwarf_info;
   eosio::vm::wasm_allocator& wa;
   backend_t& backend;
   std::vector<std::string> args;
   std::map<fc::sha256, fc::sha256> substitutions;
   std::map<fc::sha256, std::vector<uint8_t>> codes;
   std::map<fc::sha256, std::shared_ptr<cached_debugging_module>> cached_modules;
   std::vector<file> files;
   std::vector<std::unique_ptr<test_chain>> chains;
   std::vector<std::unique_ptr<test_rodeos>> rodeoses;
   std::optional<uint32_t> selected_chain_index;
};

struct intrinsic_context
{
   eosio::chain::controller& control;
   eosio::chain::platform_timer timer;
   std::unique_ptr<eosio::chain::transaction_context> trx_ctx;
   std::unique_ptr<eosio::chain::apply_context> apply_context;

   intrinsic_context(eosio::chain::controller& control) : control{control}
   {
      signed_transaction strx;
      strx.actions.emplace_back();
      strx.actions.back().account = eosio::chain::name{"eosio.null"};
      strx.actions.back().authorization.push_back(
          {eosio::chain::name{"eosio"}, eosio::chain::name{"active"}});
      trx_ctx = std::make_unique<eosio::chain::transaction_context>(control, strx, strx.id(), timer,
                                                                    fc::time_point::now());
      timer.start(fc::time_point::maximum());
      trx_ctx->explicit_billed_cpu_time = true;
      trx_ctx->init_for_implicit_trx(0);
      trx_ctx->exec();
      apply_context = std::make_unique<eosio::chain::apply_context>(control, *trx_ctx, 1, 0);
      apply_context->exec_one();
   }
};

protocol_feature_set make_protocol_feature_set()
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

template <typename T>
using wasm_ptr = eosio::vm::argument_proxy<T*>;

struct test_chain;

struct test_chain_ref
{
   test_chain* chain = {};

   test_chain_ref() = default;
   test_chain_ref(test_chain&);
   test_chain_ref(const test_chain_ref&);
   ~test_chain_ref();

   test_chain_ref& operator=(const test_chain_ref&);
};

struct debugging_module : eosio::chain::wasm_instantiated_module_interface
{
   std::shared_ptr<cached_debugging_module> cached;

   debugging_module(std::shared_ptr<cached_debugging_module> cached) : cached{std::move(cached)} {}

   void apply(eosio::chain::apply_context& context) override
   {
      cached->module->set_wasm_allocator(&context.control.get_wasm_allocator());
      eosio::chain::webassembly::interface iface(context);
      cached->module->initialize(&iface);
      cached->module->call(iface, "env", "apply", context.get_receiver().to_uint64_t(),
                           context.get_action().account.to_uint64_t(),
                           context.get_action().name.to_uint64_t());
   }
};

struct test_chain
{
   eosio::chain::private_key_type producer_key{
       "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"s};

   ::state& state;
   fc::temp_directory dir;
   std::unique_ptr<eosio::chain::controller::config> cfg;
   std::unique_ptr<eosio::chain::controller> control;
   std::optional<scoped_connection> applied_transaction_connection;
   std::optional<scoped_connection> accepted_block_connection;
   eosio::state_history::trace_converter trace_converter;
   fc::optional<block_position> prev_block;
   std::map<uint32_t, std::vector<char>> history;
   std::unique_ptr<intrinsic_context> intr_ctx;
   std::set<test_chain_ref*> refs;

   test_chain(::state& state, const char* snapshot) : state{state}
   {
      eosio::chain::genesis_state genesis;
      genesis.initial_timestamp = fc::time_point::from_iso_string("2020-01-01T00:00:00.000");
      cfg = std::make_unique<eosio::chain::controller::config>();
      cfg->blocks_dir = dir.path() / "blocks";
      cfg->state_dir = dir.path() / "state";
      cfg->contracts_console = true;
      cfg->wasm_runtime = eosio::chain::wasm_interface::vm_type::eos_vm_jit;

      std::optional<std::ifstream> snapshot_file;
      std::shared_ptr<eosio::chain::istream_snapshot_reader> snapshot_reader;
      if (snapshot && *snapshot)
      {
         std::optional<eosio::chain::chain_id_type> chain_id;
         {
            std::ifstream temp_file(snapshot, (std::ios::in | std::ios::binary));
            if (!temp_file.is_open())
               throw std::runtime_error("can not open " + std::string{snapshot});
            eosio::chain::istream_snapshot_reader tmp_reader(temp_file);
            tmp_reader.validate();
            chain_id = eosio::chain::controller::extract_chain_id(tmp_reader);
         }
         snapshot_file.emplace(snapshot, std::ios::in | std::ios::binary);
         snapshot_reader = std::make_shared<eosio::chain::istream_snapshot_reader>(*snapshot_file);
         control = std::make_unique<eosio::chain::controller>(*cfg, make_protocol_feature_set(),
                                                              *chain_id);
      }
      else
      {
         control = std::make_unique<eosio::chain::controller>(*cfg, make_protocol_feature_set(),
                                                              genesis.compute_chain_id());
      }

      control->add_indices();

      applied_transaction_connection.emplace(control->applied_transaction.connect(
          [&](std::tuple<const transaction_trace_ptr&, const signed_transaction&> t) {
             on_applied_transaction(std::get<0>(t), std::get<1>(t));
          }));
      accepted_block_connection.emplace(
          control->accepted_block.connect([&](const block_state_ptr& p) { on_accepted_block(p); }));

      if (snapshot_reader)
      {
         control->startup([] { return false; }, snapshot_reader);
      }
      else
      {
         do_startup(
             control, [] {}, [] { return false; }, genesis);
         control->start_block(control->head_block_time() + fc::microseconds(block_interval_us), 0,
                              {*control->get_protocol_feature_manager().get_builtin_digest(
                                  eosio::chain::builtin_protocol_feature_t::preactivate_feature)});
      }

      auto& iface = control->get_wasm_interface();
      iface.substitute_apply = [this](const eosio::chain::digest_type& code_hash, uint8_t vm_type,
                                      uint8_t vm_version, eosio::chain::apply_context& context) {
         return substitute_apply(code_hash, vm_type, vm_version, context);
      };
      iface.substitute_module = [this](const eosio::chain::digest_type& code_hash, uint8_t vm_type,
                                       uint8_t vm_version) {
         return substitute_module(code_hash, vm_type, vm_version);
      };
   }

   test_chain(const test_chain&) = delete;
   test_chain& operator=(const test_chain&) = delete;

   ~test_chain()
   {
      for (auto* ref : refs)
         ref->chain = nullptr;
   }

   void on_applied_transaction(const transaction_trace_ptr& p, const signed_transaction& t)
   {
      trace_converter.add_transaction(p, t);
   }

   void on_accepted_block(const block_state_ptr& block_state)
   {
      auto block_bin = fc::raw::pack(*block_state->block);
      auto traces_bin = trace_converter.pack(control->db(), false, block_state);
      auto deltas_bin = fc::raw::pack(create_deltas(control->db(), !prev_block));

      get_blocks_result_v0 message;
      message.head = block_position{control->head_block_num(), control->head_block_id()};
      message.last_irreversible = block_position{control->last_irreversible_block_num(),
                                                 control->last_irreversible_block_id()};
      message.this_block =
          block_position{block_state->block->block_num(), block_state->block->id()};
      message.prev_block = prev_block;
      message.block = std::move(block_bin);
      message.traces = std::move(traces_bin);
      message.deltas = std::move(deltas_bin);

      prev_block = message.this_block;
      history[control->head_block_num()] = fc::raw::pack(state_result{message});
   }

   void mutating() { intr_ctx.reset(); }

   auto& get_apply_context()
   {
      if (!intr_ctx)
      {
         start_if_needed();
         intr_ctx = std::make_unique<intrinsic_context>(*control);
      }
      return *intr_ctx->apply_context;
   }

   void start_block(int64_t skip_miliseconds = 0)
   {
      mutating();
      if (control->is_building_block())
         finish_block();
      control->start_block(control->head_block_time() +
                               fc::microseconds(skip_miliseconds * 1000ll + block_interval_us),
                           0);
   }

   void start_if_needed()
   {
      mutating();
      if (!control->is_building_block())
         control->start_block(control->head_block_time() + fc::microseconds(block_interval_us), 0);
   }

   void finish_block()
   {
      start_if_needed();
      ilog("finish block ${n}", ("n", control->head_block_num()));
      control->finalize_block(
          [&](eosio::chain::digest_type d) { return std::vector{producer_key.sign(d)}; });
      control->commit_block();
   }

   bool substitute_apply(const eosio::chain::digest_type& code_hash,
                         uint8_t vm_type,
                         uint8_t vm_version,
                         eosio::chain::apply_context& context)
   {
      if (vm_type || vm_version)
         return false;
      if (auto it = state.substitutions.find(code_hash); it != state.substitutions.end())
      {
         control->get_wasm_interface().apply(it->second, 0, 0, context);
         return true;
      }
      return false;
   }

   std::unique_ptr<eosio::chain::wasm_instantiated_module_interface> substitute_module(
       const eosio::chain::digest_type& code_hash,
       uint8_t vm_type,
       uint8_t vm_version)
   {
      if (vm_type || vm_version)
         return nullptr;

      if (auto it = state.cached_modules.find(code_hash); it != state.cached_modules.end())
         return std::make_unique<debugging_module>(it->second);

      if (auto it = state.codes.find(code_hash); it != state.codes.end())
      {
         IR::Module module;
         auto dwarf_info =
             dwarf::get_info_from_wasm({(const char*)it->second.data(), it->second.size()});
         auto size = dwarf::wasm_exclude_custom({(const char*)it->second.data(), it->second.size()})
                         .remaining();
         Serialization::MemoryInputStream stream(it->second.data(), size);
         WASM::scoped_skip_checks no_check;
         WASM::serialize(stream, module);
         try
         {
            eosio::vm::wasm_code_ptr code(it->second.data(), size);
            auto bkend = std::make_unique<debug_contract_backend>(code, size, nullptr);
            eosio::chain::eos_vm_host_functions_t::resolve(bkend->get_module());
            auto reg = debug_eos_vm::enable_debug(it->second, *bkend, dwarf_info, "apply");
            auto cached = std::make_shared<cached_debugging_module>(
                cached_debugging_module{std::move(bkend), std::move(reg)});
            state.cached_modules[code_hash] = cached;
            return std::make_unique<debugging_module>(cached);
         }
         catch (eosio::vm::exception& e)
         {
            FC_THROW_EXCEPTION(eosio::chain::wasm_execution_error,
                               "Error building eos-vm interp: ${e}", ("e", e.what()));
         }
      }
      return nullptr;
   }
};  // test_chain

test_chain_ref::test_chain_ref(test_chain& chain)
{
   chain.refs.insert(this);
   this->chain = &chain;
}

test_chain_ref::test_chain_ref(const test_chain_ref& src)
{
   chain = src.chain;
   if (chain)
      chain->refs.insert(this);
}

test_chain_ref::~test_chain_ref()
{
   if (chain)
      chain->refs.erase(this);
}

test_chain_ref& test_chain_ref::operator=(const test_chain_ref& src)
{
   if (chain)
      chain->refs.erase(this);
   chain = nullptr;
   if (src.chain)
      src.chain->refs.insert(this);
   chain = src.chain;
   return *this;
}

struct test_rodeos
{
   fc::temp_directory dir;
   b1::embedded_rodeos::context context;
   std::optional<b1::embedded_rodeos::partition> partition;
   std::optional<b1::embedded_rodeos::snapshot> write_snapshot;
   std::list<b1::embedded_rodeos::filter> filters;
   std::optional<b1::embedded_rodeos::query_handler> query_handler;
   test_chain_ref chain;
   uint32_t next_block = 0;
   std::vector<std::vector<char>> pushed_data;

   test_rodeos()
   {
      context.open_db(dir.path().string().c_str(), true);
      partition.emplace(context, "", 0);
      write_snapshot.emplace(partition->obj, true);
   }
};

eosio::checksum256 convert(const eosio::chain::checksum_type& obj)
{
   std::array<uint8_t, 32> bytes;
   static_assert(bytes.size() == sizeof(obj));
   memcpy(bytes.data(), &obj, bytes.size());
   return eosio::checksum256(bytes);
}

chain_types::account_delta convert(const eosio::chain::account_delta& obj)
{
   chain_types::account_delta result;
   result.account.value = to_uint64_t(obj.account);
   result.delta = obj.delta;
   return result;
}

chain_types::action_receipt_v0 convert(const eosio::chain::action_receipt& obj)
{
   chain_types::action_receipt_v0 result;
   result.receiver.value = to_uint64_t(obj.receiver);
   result.act_digest = convert(obj.act_digest);
   result.global_sequence = obj.global_sequence;
   result.recv_sequence = obj.recv_sequence;
   for (auto& auth : obj.auth_sequence)
      result.auth_sequence.push_back({eosio::name{to_uint64_t(auth.first)}, auth.second});
   result.code_sequence.value = obj.code_sequence.value;
   result.abi_sequence.value = obj.abi_sequence.value;
   return result;
}

chain_types::action convert(const eosio::chain::action& obj)
{
   chain_types::action result;
   result.account.value = to_uint64_t(obj.account);
   result.name.value = to_uint64_t(obj.name);
   for (auto& auth : obj.authorization)
      result.authorization.push_back(
          {eosio::name{to_uint64_t(auth.actor)}, eosio::name{to_uint64_t(auth.permission)}});
   result.data = {obj.data.data(), obj.data.data() + obj.data.size()};
   return result;
}

chain_types::action_trace_v0 convert(const eosio::chain::action_trace& obj)
{
   chain_types::action_trace_v0 result;
   result.action_ordinal.value = obj.action_ordinal.value;
   result.creator_action_ordinal.value = obj.creator_action_ordinal.value;
   if (obj.receipt)
      result.receipt = convert(*obj.receipt);
   result.receiver.value = to_uint64_t(obj.receiver);
   result.act = convert(obj.act);
   result.context_free = obj.context_free;
   result.elapsed = obj.elapsed.count();
   result.console = obj.console;
   for (auto& delta : obj.account_ram_deltas)
      result.account_ram_deltas.push_back(convert(delta));
   if (obj.except)
      result.except = obj.except->to_string();
   if (obj.error_code)
      result.error_code = *obj.error_code;
   return result;
}

chain_types::transaction_trace_v0 convert(const eosio::chain::transaction_trace& obj)
{
   chain_types::transaction_trace_v0 result{};
   result.id = convert(obj.id);
   if (obj.receipt)
   {
      result.status = (chain_types::transaction_status)obj.receipt->status.value;
      result.cpu_usage_us = obj.receipt->cpu_usage_us;
      result.net_usage_words = obj.receipt->net_usage_words.value;
   }
   else
   {
      result.status = chain_types::transaction_status::hard_fail;
   }
   result.elapsed = obj.elapsed.count();
   result.net_usage = obj.net_usage;
   result.scheduled = obj.scheduled;
   for (auto& at : obj.action_traces)
      result.action_traces.push_back(convert(at));
   if (obj.account_ram_delta)
      result.account_ram_delta = convert(*obj.account_ram_delta);
   if (obj.except)
      result.except = obj.except->to_string();
   if (obj.error_code)
      result.error_code = *obj.error_code;
   if (obj.failed_dtrx_trace)
      result.failed_dtrx_trace.push_back({convert(*obj.failed_dtrx_trace)});
   return result;
}

struct contract_row
{
   uint32_t block_num = {};
   bool present = {};
   eosio::name code = {};
   eosio::name scope = {};
   eosio::name table = {};
   uint64_t primary_key = {};
   eosio::name payer = {};
   eosio::input_stream value = {};
};

EOSIO_REFLECT(contract_row, block_num, present, code, scope, table, primary_key, payer, value);

struct file
{
   FILE* f = nullptr;
   bool owns = false;

   file(FILE* f = nullptr, bool owns = true) : f(f), owns(owns) {}

   file(const file&) = delete;
   file(file&& src) { *this = std::move(src); }

   ~file() { close(); }

   file& operator=(const file&) = delete;

   file& operator=(file&& src)
   {
      close();
      this->f = src.f;
      this->owns = src.owns;
      src.f = nullptr;
      src.owns = false;
      return *this;
   }

   void close()
   {
      if (owns && f)
         fclose(f);
      f = nullptr;
      owns = false;
   }
};

struct push_trx_args
{
   eosio::chain::bytes transaction;
   std::vector<eosio::chain::bytes> context_free_data;
   std::vector<eosio::chain::signature_type> signatures;
   std::vector<eosio::chain::private_key_type> keys;
};
FC_REFLECT(push_trx_args, (transaction)(context_free_data)(signatures)(keys))

#define DB_WRAPPERS_SIMPLE_SECONDARY(IDX, TYPE)                                                  \
   int32_t db_##IDX##_find_secondary(uint64_t code, uint64_t scope, uint64_t table,              \
                                     wasm_ptr<const TYPE> secondary, wasm_ptr<uint64_t> primary) \
   {                                                                                             \
      return selected().IDX.find_secondary(code, scope, table, *secondary, *primary);            \
   }                                                                                             \
   int32_t db_##IDX##_find_primary(uint64_t code, uint64_t scope, uint64_t table,                \
                                   wasm_ptr<TYPE> secondary, uint64_t primary)                   \
   {                                                                                             \
      return selected().IDX.find_primary(code, scope, table, *secondary, primary);               \
   }                                                                                             \
   int32_t db_##IDX##_lowerbound(uint64_t code, uint64_t scope, uint64_t table,                  \
                                 wasm_ptr<TYPE> secondary, wasm_ptr<uint64_t> primary)           \
   {                                                                                             \
      return selected().IDX.lowerbound_secondary(code, scope, table, *secondary, *primary);      \
   }                                                                                             \
   int32_t db_##IDX##_upperbound(uint64_t code, uint64_t scope, uint64_t table,                  \
                                 wasm_ptr<TYPE> secondary, wasm_ptr<uint64_t> primary)           \
   {                                                                                             \
      return selected().IDX.upperbound_secondary(code, scope, table, *secondary, *primary);      \
   }                                                                                             \
   int32_t db_##IDX##_end(uint64_t code, uint64_t scope, uint64_t table)                         \
   {                                                                                             \
      return selected().IDX.end_secondary(code, scope, table);                                   \
   }                                                                                             \
   int32_t db_##IDX##_next(int32_t iterator, wasm_ptr<uint64_t> primary)                         \
   {                                                                                             \
      return selected().IDX.next_secondary(iterator, *primary);                                  \
   }                                                                                             \
   int32_t db_##IDX##_previous(int32_t iterator, wasm_ptr<uint64_t> primary)                     \
   {                                                                                             \
      return selected().IDX.previous_secondary(iterator, *primary);                              \
   }

#define DB_WRAPPERS_ARRAY_SECONDARY(IDX, ARR_SIZE, ARR_ELEMENT_TYPE)                              \
   int db_##IDX##_find_secondary(uint64_t code, uint64_t scope, uint64_t table,                   \
                                 eosio::chain::array_ptr<const ARR_ELEMENT_TYPE> data,            \
                                 uint32_t data_len, uint64_t& primary)                            \
   {                                                                                              \
      EOS_ASSERT(data_len == ARR_SIZE, eosio::chain::db_api_exception,                            \
                 "invalid size of secondary key array for " #IDX                                  \
                 ": given ${given} bytes but expected ${expected} bytes",                         \
                 ("given", data_len)("expected", ARR_SIZE));                                      \
      return selected().IDX.find_secondary(code, scope, table, data, primary);                    \
   }                                                                                              \
   int db_##IDX##_find_primary(uint64_t code, uint64_t scope, uint64_t table,                     \
                               eosio::chain::array_ptr<ARR_ELEMENT_TYPE> data, uint32_t data_len, \
                               uint64_t primary)                                                  \
   {                                                                                              \
      EOS_ASSERT(data_len == ARR_SIZE, eosio::chain::db_api_exception,                            \
                 "invalid size of secondary key array for " #IDX                                  \
                 ": given ${given} bytes but expected ${expected} bytes",                         \
                 ("given", data_len)("expected", ARR_SIZE));                                      \
      return selected().IDX.find_primary(code, scope, table, data.value, primary);                \
   }                                                                                              \
   int db_##IDX##_lowerbound(uint64_t code, uint64_t scope, uint64_t table,                       \
                             eosio::chain::array_ptr<ARR_ELEMENT_TYPE> data, uint32_t data_len,   \
                             uint64_t& primary)                                                   \
   {                                                                                              \
      EOS_ASSERT(data_len == ARR_SIZE, eosio::chain::db_api_exception,                            \
                 "invalid size of secondary key array for " #IDX                                  \
                 ": given ${given} bytes but expected ${expected} bytes",                         \
                 ("given", data_len)("expected", ARR_SIZE));                                      \
      return selected().IDX.lowerbound_secondary(code, scope, table, data.value, primary);        \
   }                                                                                              \
   int db_##IDX##_upperbound(uint64_t code, uint64_t scope, uint64_t table,                       \
                             eosio::chain::array_ptr<ARR_ELEMENT_TYPE> data, uint32_t data_len,   \
                             uint64_t& primary)                                                   \
   {                                                                                              \
      EOS_ASSERT(data_len == ARR_SIZE, eosio::chain::db_api_exception,                            \
                 "invalid size of secondary key array for " #IDX                                  \
                 ": given ${given} bytes but expected ${expected} bytes",                         \
                 ("given", data_len)("expected", ARR_SIZE));                                      \
      return selected().IDX.upperbound_secondary(code, scope, table, data.value, primary);        \
   }                                                                                              \
   int db_##IDX##_end(uint64_t code, uint64_t scope, uint64_t table)                              \
   {                                                                                              \
      return selected().IDX.end_secondary(code, scope, table);                                    \
   }                                                                                              \
   int db_##IDX##_next(int iterator, uint64_t& primary)                                           \
   {                                                                                              \
      return selected().IDX.next_secondary(iterator, primary);                                    \
   }                                                                                              \
   int db_##IDX##_previous(int iterator, uint64_t& primary)                                       \
   {                                                                                              \
      return selected().IDX.previous_secondary(iterator, primary);                                \
   }

// clang-format off
#define DB_WRAPPERS_FLOAT_SECONDARY(IDX, TYPE)                                                 \
   int db_##IDX##_find_secondary(uint64_t code, uint64_t scope, uint64_t table,                \
                                 const TYPE& secondary, uint64_t& primary)                     \
   {                                                                                           \
      /* EOS_ASSERT(!softfloat_api::is_nan(secondary), transaction_exception, "NaN is not an   \
       * allowed value for a secondary key"); */                                               \
      return selected().IDX.find_secondary(code, scope, table, secondary, primary);            \
   }                                                                                           \
   int db_##IDX##_find_primary(uint64_t code, uint64_t scope, uint64_t table, TYPE& secondary, \
                               uint64_t primary)                                               \
   {                                                                                           \
      return selected().IDX.find_primary(code, scope, table, secondary, primary);              \
   }                                                                                           \
   int db_##IDX##_lowerbound(uint64_t code, uint64_t scope, uint64_t table, TYPE& secondary,   \
                             uint64_t& primary)                                                \
   {                                                                                           \
      /* EOS_ASSERT(!softfloat_api::is_nan(secondary), transaction_exception, "NaN is not an   \
       * allowed value for a secondary key"); */                                               \
      return selected().IDX.lowerbound_secondary(code, scope, table, secondary, primary);      \
   }                                                                                           \
   int db_##IDX##_upperbound(uint64_t code, uint64_t scope, uint64_t table, TYPE& secondary,   \
                             uint64_t& primary)                                                \
   {                                                                                           \
      /* EOS_ASSERT(!softfloat_api::is_nan(secondary), transaction_exception, "NaN is not an   \
       * allowed value for a secondary key"); */                                               \
      return selected().IDX.upperbound_secondary(code, scope, table, secondary, primary);      \
   }                                                                                           \
   int db_##IDX##_end(uint64_t code, uint64_t scope, uint64_t table)                           \
   {                                                                                           \
      return selected().IDX.end_secondary(code, scope, table);                                 \
   }                                                                                           \
   int db_##IDX##_next(int iterator, uint64_t& primary)                                        \
   {                                                                                           \
      return selected().IDX.next_secondary(iterator, primary);                                 \
   }                                                                                           \
   int db_##IDX##_previous(int iterator, uint64_t& primary)                                    \
   {                                                                                           \
      return selected().IDX.previous_secondary(iterator, primary);                             \
   }
// clang-format on

struct callbacks
{
   ::state& state;
   static callbacks* single;  // TODO: remove

   callbacks(::state& state) : state{state} { single = this; }
   ~callbacks() { single = nullptr; }

   void backtrace()
   {
      void* data[max_backtrace_frames];
      int count =
          state.backend.get_context().backtrace(data, sizeof(data) / sizeof(data[0]), nullptr);
      for (int i = 0; i < count; ++i)
      {
         auto& di = state.dwarf_info;
         auto file_offset = state.backend.get_debug().translate(data[i]);
         if (file_offset == 0xffff'ffff)
            continue;
         const auto* loc = di.get_location(file_offset - di.wasm_code_offset);
         const auto* sub = di.get_subprogram(file_offset - di.wasm_code_offset);
         if (loc)
            fprintf(stderr, "%s:%d", di.files[loc->file_index].c_str(), loc->line);
         else
            fprintf(stderr, "<wasm address 0x%08x>", file_offset - di.wasm_code_offset);
         if (sub)
            fprintf(stderr, ": %s", sub->demangled_name.c_str());
         fprintf(stderr, "\n");
      }
   }

   void check_bounds(void* data, size_t size)
   {
      volatile auto check = *((const char*)data + size - 1);
      eosio::vm::ignore_unused_variable_warning(check);
   }

   template <typename T>
   T unpack(const char* begin, size_t size)
   {
      fc::datastream<const char*> ds(begin, size);
      T args;
      fc::raw::unpack(ds, args);
      return args;
   }

   template <typename T>
   T unpack(span<const char> data)
   {
      return unpack<T>(data.begin(), data.size());
   }

   template <typename T>
   T unpack(const eosio::input_stream& data)
   {
      return unpack<T>(data.pos, data.end - data.pos);
   }

   std::string span_str(span<const char> str) { return {str.data(), str.size()}; }

   char* alloc(uint32_t cb_alloc_data, uint32_t cb_alloc, uint32_t size)
   {
      // todo: verify cb_alloc isn't in imports
      if (state.backend.get_module().tables.size() < 0 ||
          state.backend.get_module().tables[0].table.size() < cb_alloc)
      {
         backtrace();
         throw std::runtime_error("cb_alloc is out of range");
      }
      // Note from Steven: eos-vm not saving top_frame and bottom_frame is an eos-vm bug. The
      // backtrace was originally designed for profiling contracts, where reentering wasm is not
      // possible. In addition, saving and restoring these variables is very tricky to do correctly
      // in the face of asynchronous interrupts, so I didn't bother.
      auto top_frame = state.backend.get_context()._top_frame;
      auto bottom_frame = state.backend.get_context()._bottom_frame;
      auto result = state.backend.get_context().execute(  //
          this, eosio::vm::jit_visitor(42), state.backend.get_module().tables[0].table[cb_alloc],
          cb_alloc_data, size);
      state.backend.get_context()._top_frame = top_frame;
      state.backend.get_context()._bottom_frame = bottom_frame;
      if (!result || !result->is_a<eosio::vm::i32_const_t>())
      {
         backtrace();
         throw std::runtime_error("cb_alloc returned incorrect type");
      }
      char* begin = state.wa.get_base_ptr<char>() + result->to_ui32();
      check_bounds(begin, size);
      return begin;
   }

   template <typename T>
   void set_data(uint32_t cb_alloc_data, uint32_t cb_alloc, const T& data)
   {
      memcpy(alloc(cb_alloc_data, cb_alloc, data.size()), data.data(), data.size());
   }

   void set_data(uint32_t cb_alloc_data, uint32_t cb_alloc, const b1::embedded_rodeos::result& data)
   {
      memcpy(alloc(cb_alloc_data, cb_alloc, data.size), data.data, data.size);
   }

   void tester_abort()
   {
      backtrace();
      throw std::runtime_error("called tester_abort");
   }

   void eosio_exit(int32_t)
   {
      backtrace();
      throw std::runtime_error("called eosio_exit");
   }

   void eosio_assert_message(bool condition, span<const char> msg)
   {
      if (!condition)
      {
         backtrace();
         throw ::assert_exception(span_str(msg));
      }
   }

   void prints_l(span<const char> str) { std::cout.write(str.data(), str.size()); }

   void tester_get_arg_counts(wasm_ptr<uint32_t> argc, wasm_ptr<uint32_t> argv_buf_size)
   {
      uint32_t size = 0;
      for (auto& a : state.args)
         size += a.size() + 1;
      *argc = state.args.size();
      *argv_buf_size = size;
   };

   // uint8_t** argv, uint8_t* argv_buf
   void tester_get_args(uint32_t argv, uint32_t argv_buf)
   {
      auto* memory = state.backend.get_context().linear_memory();
      auto get_argv = [&]() -> uint32_t& { return *reinterpret_cast<uint32_t*>(memory + argv); };
      auto get_argv_buf = [&]() -> uint8_t& {
         return *reinterpret_cast<uint8_t*>(memory + argv_buf);
      };

      for (auto& a : state.args)
      {
         get_argv() = argv_buf;
         argv += 4;
         for (auto ch : a)
         {
            get_argv_buf() = ch;
            ++argv_buf;
         }
         get_argv_buf() = 0;
         ++argv_buf;
      }
   };

   int32_t tester_clock_time_get(uint32_t id, uint64_t precision, wasm_ptr<uint64_t> time)
   {
      std::chrono::nanoseconds result;
      if (id == 0)
      {  // CLOCK_REALTIME
         result = std::chrono::system_clock::now().time_since_epoch();
      }
      else if (id == 1)
      {  // CLOCK_MONOTONIC
         result = std::chrono::steady_clock::now().time_since_epoch();
      }
      else
      {
         return wasi_errno_inval;
      }
      *time = result.count();
      return 0;
   }

   file* get_file(int32_t file_index)
   {
      if (file_index < 0 || static_cast<uint32_t>(file_index) >= state.files.size() ||
          !state.files[file_index].f)
         return nullptr;
      return &state.files[file_index];
   }

   uint32_t tester_fdstat_get(int32_t fd,
                              wasm_ptr<uint8_t> fs_filetype,
                              wasm_ptr<uint16_t> fs_flags,
                              wasm_ptr<uint64_t> fs_rights_base,
                              wasm_ptr<uint64_t> fs_rights_inheriting)
   {
      if (fd == STDIN_FILENO)
      {
         *fs_filetype = wasi_filetype_character_device;
         *fs_flags = 0;
         *fs_rights_base = wasi_rights_fd_read;
         *fs_rights_inheriting = 0;
         return 0;
      }
      if (fd == STDOUT_FILENO || fd == STDERR_FILENO)
      {
         *fs_filetype = wasi_filetype_character_device;
         *fs_flags = wasi_fdflags_append;
         *fs_rights_base = wasi_rights_fd_write;
         *fs_rights_inheriting = 0;
         return 0;
      }
      if (fd == polyfill_root_dir_fd)
      {
         *fs_filetype = wasi_filetype_directory;
         *fs_flags = 0;
         *fs_rights_base = 0;
         *fs_rights_inheriting = wasi_rights_fd_read | wasi_rights_fd_write;
         return 0;
      }
      if (get_file(fd))
      {
         *fs_filetype = wasi_filetype_regular_file;
         *fs_flags = 0;
         *fs_rights_base = wasi_rights_fd_read | wasi_rights_fd_write;
         *fs_rights_inheriting = 0;
         return 0;
      }
      return wasi_errno_badf;
   }

   uint32_t tester_open_file(span<const char> path,
                             uint32_t oflags,
                             uint64_t fs_rights_base,
                             uint32_t fdflags,
                             wasm_ptr<int32_t> opened_fd)
   {
      if (oflags & wasi_oflags_directory)
         return wasi_errno_inval;
      if (fdflags & wasi_fdflags_nonblock)
         return wasi_errno_inval;

      bool read = fs_rights_base & wasi_rights_fd_read;
      bool write = fs_rights_base & wasi_rights_fd_write;
      bool create = oflags & wasi_oflags_creat;
      bool excl = oflags & wasi_oflags_excl;
      bool trunc = oflags & wasi_oflags_trunc;
      bool append = fdflags & wasi_fdflags_append;

      // TODO: move away from fopen to allow more flexible options
      const char* mode = nullptr;
      if (read && !create && !excl && !trunc && !append)
      {
         if (write)
            mode = "r+";
         else
            mode = "r";
      }
      else if (write && create && trunc)
      {
         if (read)
         {
            if (excl)
               mode = "w+x";
            else
               mode = "w+";
         }
         else
         {
            if (excl)
               mode = "wx";
            else
               mode = "w";
         }
      }
      else if (write && create && append)
      {
         if (read)
         {
            if (excl)
               mode = "a+x";
            else
               mode = "a+";
         }
         else
         {
            if (excl)
               mode = "ax";
            else
               mode = "a";
         }
      }

      if (!mode)
         return wasi_errno_inval;

      file f = fopen(span_str(path).c_str(), mode);
      if (!f.f)
         return wasi_errno_noent;
      state.files.push_back(std::move(f));
      *opened_fd = state.files.size() - 1;
      return 0;
   }

   uint32_t tester_close_file(int32_t fd)
   {
      auto* file = get_file(fd);
      if (!file)
         return wasi_errno_badf;
      file->close();
      return 0;
   }

   uint32_t tester_write_file(int32_t fd, span<const char> content)
   {
      auto* file = get_file(fd);
      if (!file)
         return wasi_errno_badf;
      if (!content.size() || fwrite(content.data(), content.size(), 1, file->f) == 1)
         return 0;
      return wasi_errno_io;
   }

   uint32_t tester_read_file(int32_t fd, span<char> content, wasm_ptr<int32_t> result)
   {
      auto* file = get_file(fd);
      if (!file)
         return wasi_errno_badf;
      *result = fread(content.data(), 1, content.size(), file->f);
      return 0;
   }

   bool tester_read_whole_file(span<const char> filename, uint32_t cb_alloc_data, uint32_t cb_alloc)
   {
      file f = fopen(span_str(filename).c_str(), "r");
      if (!f.f)
         return false;
      if (fseek(f.f, 0, SEEK_END))
         return false;
      auto size = ftell(f.f);
      if (size < 0 || (long)(uint32_t)size != size)
         return false;
      if (fseek(f.f, 0, SEEK_SET))
         return false;
      std::vector<char> buf(size);
      if (fread(buf.data(), size, 1, f.f) != 1)
         return false;
      set_data(cb_alloc_data, cb_alloc, buf);
      return true;
   }

   int32_t tester_execute(span<const char> command) { return system(span_str(command).c_str()); }

   test_chain& assert_chain(uint32_t chain, bool require_control = true)
   {
      if (chain >= state.chains.size() || !state.chains[chain])
         throw std::runtime_error("chain does not exist or was destroyed");
      auto& result = *state.chains[chain];
      if (require_control && !result.control)
         throw std::runtime_error("chain was shut down");
      return result;
   }

   uint32_t tester_create_chain(span<const char> snapshot)
   {
      state.chains.push_back(std::make_unique<test_chain>(state, span_str(snapshot).c_str()));
      if (state.chains.size() == 1)
         state.selected_chain_index = 0;
      return state.chains.size() - 1;
   }

   void tester_destroy_chain(uint32_t chain)
   {
      assert_chain(chain, false);
      if (state.selected_chain_index && *state.selected_chain_index == chain)
         state.selected_chain_index.reset();
      state.chains[chain].reset();
      while (!state.chains.empty() && !state.chains.back())
      {
         state.chains.pop_back();
      }
   }

   void tester_shutdown_chain(uint32_t chain)
   {
      auto& c = assert_chain(chain);
      c.control.reset();
   }

   uint32_t tester_get_chain_path(uint32_t chain, span<char> dest)
   {
      auto& c = assert_chain(chain, false);
      auto s = c.dir.path().string();
      memcpy(dest.data(), s.c_str(), std::min(dest.size(), s.size()));
      return s.size();
   }

   void tester_replace_producer_keys(uint32_t chain_index, span<const char> key)
   {
      auto& chain = assert_chain(chain_index);
      auto k = unpack<eosio::chain::public_key_type>(key);
      chain.control->replace_producer_keys(k);
   }

   void tester_replace_account_keys(uint32_t chain_index,
                                    uint64_t account,
                                    uint64_t permission,
                                    span<const char> key)
   {
      auto& chain = assert_chain(chain_index);
      auto k = unpack<eosio::chain::public_key_type>(key);
      chain.control->replace_account_keys(eosio::chain::name{account},
                                          eosio::chain::name{permission}, k);
   }

   void tester_start_block(uint32_t chain_index, int64_t skip_miliseconds)
   {
      assert_chain(chain_index).start_block(skip_miliseconds);
   }

   void tester_finish_block(uint32_t chain_index) { assert_chain(chain_index).finish_block(); }

   void tester_get_head_block_info(uint32_t chain_index, uint32_t cb_alloc_data, uint32_t cb_alloc)
   {
      auto& chain = assert_chain(chain_index);
      chain_types::block_info info;
      info.block_num = chain.control->head_block_num();
      info.block_id = convert(chain.control->head_block_id());
      info.timestamp.slot = chain.control->head_block_state()->header.timestamp.slot;
      set_data(cb_alloc_data, cb_alloc, convert_to_bin(info));
   }

   void tester_push_transaction(uint32_t chain_index,
                                span<const char> args_packed,
                                uint32_t cb_alloc_data,
                                uint32_t cb_alloc)
   {
      auto args = unpack<push_trx_args>(args_packed);
      auto transaction = unpack<eosio::chain::transaction>(args.transaction);
      signed_transaction signed_trx{std::move(transaction), std::move(args.signatures),
                                    std::move(args.context_free_data)};
      auto& chain = assert_chain(chain_index);
      chain.start_if_needed();
      for (auto& key : args.keys)
         signed_trx.sign(key, chain.control->get_chain_id());
      auto ptrx = std::make_shared<eosio::chain::packed_transaction>(
          std::move(signed_trx), eosio::chain::packed_transaction::compression_type::none);
      auto fut = eosio::chain::transaction_metadata::start_recover_keys(
          ptrx, chain.control->get_thread_pool(), chain.control->get_chain_id(),
          fc::microseconds::maximum());
      auto start_time = std::chrono::steady_clock::now();
      auto result =
          chain.control->push_transaction(fut.get(), fc::time_point::maximum(), 2000, true, 2000);
      auto us = std::chrono::duration_cast<std::chrono::microseconds>(
          std::chrono::steady_clock::now() - start_time);
      ilog("chainlib transaction took ${u} us", ("u", us.count()));
      // ilog("${r}", ("r", fc::json::to_pretty_string(result)));
      set_data(cb_alloc_data, cb_alloc,
               convert_to_bin(chain_types::transaction_trace{convert(*result)}));
   }

   bool tester_exec_deferred(uint32_t chain_index, uint32_t cb_alloc_data, uint32_t cb_alloc)
   {
      auto& chain = assert_chain(chain_index);
      chain.start_if_needed();
      const auto& idx =
          chain.control->db()
              .get_index<eosio::chain::generated_transaction_multi_index, eosio::chain::by_delay>();
      auto itr = idx.begin();
      if (itr != idx.end() && itr->delay_until <= chain.control->pending_block_time())
      {
         auto trace = chain.control->push_scheduled_transaction(
             itr->trx_id, fc::time_point::maximum(), billed_cpu_time_use, true);
         set_data(cb_alloc_data, cb_alloc,
                  convert_to_bin(chain_types::transaction_trace{convert(*trace)}));
         return true;
      }
      return false;
   }

   uint32_t tester_get_history(uint32_t chain_index, uint32_t block_num, span<char> dest)
   {
      auto& chain = assert_chain(chain_index);
      std::map<uint32_t, std::vector<char>>::iterator it;
      if (block_num == 0xffff'ffff && !chain.history.empty())
         it = --chain.history.end();
      else
      {
         it = chain.history.find(block_num);
         if (it == chain.history.end())
            return 0;
      }
      memcpy(dest.data(), it->second.data(), std::min(dest.size(), it->second.size()));
      return it->second.size();
   }

   void tester_select_chain_for_db(uint32_t chain_index)
   {
      assert_chain(chain_index);
      state.selected_chain_index = chain_index;
   }

   auto& selected()
   {
      if (!state.selected_chain_index || *state.selected_chain_index >= state.chains.size() ||
          !state.chains[*state.selected_chain_index] ||
          !state.chains[*state.selected_chain_index]->control)
         throw std::runtime_error(
             "tester_select_chain_for_db() must be called before using multi_index");
      return state.chains[*state.selected_chain_index]->get_apply_context();
   }

   test_rodeos& assert_rodeos(uint32_t rodeos)
   {
      if (rodeos >= state.rodeoses.size() || !state.rodeoses[rodeos])
         throw std::runtime_error("rodeos does not exist or was destroyed");
      return *state.rodeoses[rodeos];
   }

   uint32_t tester_create_rodeos()
   {
      state.rodeoses.push_back(std::make_unique<test_rodeos>());
      return state.rodeoses.size() - 1;
   }

   void tester_destroy_rodeos(uint32_t rodeos)
   {
      assert_rodeos(rodeos);
      state.rodeoses[rodeos].reset();
      while (!state.rodeoses.empty() && !state.rodeoses.back())
      {
         state.rodeoses.pop_back();
      }
   }

   void tester_rodeos_add_filter(uint32_t rodeos, uint64_t name, span<const char> wasm_filename)
   {
      auto& r = assert_rodeos(rodeos);
      r.filters.emplace_back(name, span_str(wasm_filename).c_str());
   }

   void tester_rodeos_enable_queries(uint32_t rodeos,
                                     uint32_t max_console_size,
                                     uint32_t wasm_cache_size,
                                     uint64_t max_exec_time_ms,
                                     span<const char> contract_dir)
   {
      auto& r = assert_rodeos(rodeos);
      r.query_handler.emplace(*r.partition, max_console_size, wasm_cache_size, max_exec_time_ms,
                              span_str(contract_dir).c_str());
   }

   void tester_connect_rodeos(uint32_t rodeos, uint32_t chain)
   {
      auto& r = assert_rodeos(rodeos);
      auto& c = assert_chain(chain);
      if (r.chain.chain)
         throw std::runtime_error("rodeos is already connected");
      r.chain = test_chain_ref{c};
   }

   bool tester_rodeos_sync_block(uint32_t rodeos)
   {
      auto& r = assert_rodeos(rodeos);
      if (!r.chain.chain)
         throw std::runtime_error("rodeos is not connected to a chain");
      auto it = r.chain.chain->history.lower_bound(r.next_block);
      if (it == r.chain.chain->history.end())
         return false;
      r.write_snapshot->start_block(it->second.data(), it->second.size());
      r.write_snapshot->write_block_info(it->second.data(), it->second.size());
      r.write_snapshot->write_deltas(it->second.data(), it->second.size(), [] { return false; });
      for (auto& filter : r.filters)
      {
         try
         {
            filter.run(*r.write_snapshot, it->second.data(), it->second.size(),
                       [&](const char* data, uint64_t size) {
                          r.pushed_data.emplace_back(data, data + size);
                          return true;
                       });
         }
         catch (std::exception& e)
         {
            throw std::runtime_error("filter failed: " + std::string{e.what()});
         }
      }
      r.write_snapshot->end_block(it->second.data(), it->second.size(), true);
      r.next_block = it->first + 1;
      return true;
   }

   void tester_rodeos_push_transaction(uint32_t rodeos,
                                       span<const char> packed_args,
                                       uint32_t cb_alloc_data,
                                       uint32_t cb_alloc)
   {
      auto& r = assert_rodeos(rodeos);
      if (!r.chain.chain)
         throw std::runtime_error("rodeos is not connected to a chain");
      if (!r.query_handler)
         throw std::runtime_error(
             "call tester_rodeos_enable_queries before tester_rodeos_push_transaction");
      auto& chain = *r.chain.chain;
      chain.start_if_needed();

      auto args = unpack<push_trx_args>(packed_args);
      auto transaction = unpack<eosio::chain::transaction>(args.transaction);
      signed_transaction signed_trx{std::move(transaction), std::move(args.signatures),
                                    std::move(args.context_free_data)};
      for (auto& key : args.keys)
         signed_trx.sign(key, chain.control->get_chain_id());
      eosio::chain::packed_transaction ptrx{
          std::move(signed_trx), eosio::chain::packed_transaction::compression_type::none};
      auto data = fc::raw::pack(ptrx);
      auto start_time = std::chrono::steady_clock::now();
      auto result = r.query_handler->query_transaction(*r.write_snapshot, data.data(), data.size());
      auto us = std::chrono::duration_cast<std::chrono::microseconds>(
          std::chrono::steady_clock::now() - start_time);
      ilog("rodeos transaction took ${u} us", ("u", us.count()));
      auto tt = eosio::convert_from_bin<eosio::ship_protocol::transaction_trace>(
          {result.data, result.data + result.size});
      auto& tt0 = std::get<eosio::ship_protocol::transaction_trace_v0>(tt);
      for (auto& at : tt0.action_traces)
      {
         auto& at1 = std::get<eosio::ship_protocol::action_trace_v0>(at);
         if (!at1.console.empty())
            ilog("rodeos query console: <<<\n${c}>>>", ("c", at1.console));
      }
      set_data(cb_alloc_data, cb_alloc, result);
   }

   uint32_t tester_rodeos_get_num_pushed_data(uint32_t rodeos)
   {
      auto& r = assert_rodeos(rodeos);
      return r.pushed_data.size();
   }

   uint32_t tester_rodeos_get_pushed_data(uint32_t rodeos, uint32_t index, span<char> dest)
   {
      auto& r = assert_rodeos(rodeos);
      if (index >= r.pushed_data.size())
         throw std::runtime_error("tester_rodeos_get_pushed_data: index is out of range");
      memcpy(dest.data(), r.pushed_data[index].data(),
             std::min(dest.size(), r.pushed_data[index].size()));
      return r.pushed_data[index].size();
   }

   // clang-format off
   int32_t db_get_i64(int32_t iterator, span<char> buffer)                                {return selected().db_get_i64(iterator, buffer.data(), buffer.size());}
   int32_t db_next_i64(int32_t iterator, wasm_ptr<uint64_t> primary)                      {return selected().db_next_i64(iterator, *primary);}
   int32_t db_previous_i64(int32_t iterator, wasm_ptr<uint64_t> primary)                  {return selected().db_previous_i64(iterator, *primary);}
   int32_t db_find_i64(uint64_t code, uint64_t scope, uint64_t table, uint64_t id)        {return selected().db_find_i64(eosio::chain::name{code}, eosio::chain::name{scope}, eosio::chain::name{table}, id);}
   int32_t db_lowerbound_i64(uint64_t code, uint64_t scope, uint64_t table, uint64_t id)  {return selected().db_lowerbound_i64(eosio::chain::name{code}, eosio::chain::name{scope}, eosio::chain::name{table}, id);}
   int32_t db_upperbound_i64(uint64_t code, uint64_t scope, uint64_t table, uint64_t id)  {return selected().db_upperbound_i64(eosio::chain::name{code}, eosio::chain::name{scope}, eosio::chain::name{table}, id);}
   int32_t db_end_i64(uint64_t code, uint64_t scope, uint64_t table)                      {return selected().db_end_i64(eosio::chain::name{code}, eosio::chain::name{scope}, eosio::chain::name{table});}

   int32_t db_idx64_find_secondary(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<const uint64_t> secondary,
                                     wasm_ptr<uint64_t> primary) {
      return selected().idx64.find_secondary(code, scope, table, *secondary, *primary);
   }
   int32_t db_idx64_find_primary(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<uint64_t> secondary,
                                   uint64_t primary) {
      return selected().idx64.find_primary(code, scope, table, *secondary, primary);
   }
   int32_t db_idx64_lowerbound(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<uint64_t> secondary,
                                 wasm_ptr<uint64_t> primary) {
      return selected().idx64.lowerbound_secondary(code, scope, table, *secondary, *primary);
   }
   int32_t db_idx64_upperbound(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<uint64_t> secondary,
                                 wasm_ptr<uint64_t> primary) {
      return selected().idx64.upperbound_secondary(code, scope, table, *secondary, *primary);
   }
   int32_t db_idx64_end(uint64_t code, uint64_t scope, uint64_t table) {
      return selected().idx64.end_secondary(code, scope, table);
   }
   int32_t db_idx64_next(int32_t iterator, wasm_ptr<uint64_t> primary) {
      return selected().idx64.next_secondary(iterator, *primary);
   }
   int32_t db_idx64_previous(int32_t iterator, wasm_ptr<uint64_t> primary) {
      return selected().idx64.previous_secondary(iterator, *primary);
   }

   int32_t db_idx128_find_secondary(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<const unsigned __int128> secondary,
                                   wasm_ptr<uint64_t> primary) {
      return selected().idx128.find_secondary(code, scope, table, *secondary, *primary);
   }
   int32_t db_idx128_find_primary(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<unsigned __int128> secondary,
                                 uint64_t primary) {
      return selected().idx128.find_primary(code, scope, table, *secondary, primary);
   }
   int32_t db_idx128_lowerbound(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<unsigned __int128> secondary,
                               wasm_ptr<uint64_t> primary) {
      return selected().idx128.lowerbound_secondary(code, scope, table, *secondary, *primary);
   }
   int32_t db_idx128_upperbound(uint64_t code, uint64_t scope, uint64_t table, wasm_ptr<unsigned __int128> secondary,
                               wasm_ptr<uint64_t> primary) {
      return selected().idx128.upperbound_secondary(code, scope, table, *secondary, *primary);
   }
   int32_t db_idx128_end(uint64_t code, uint64_t scope, uint64_t table) {
      return selected().idx128.end_secondary(code, scope, table);
   }
   int32_t db_idx128_next(int32_t iterator, wasm_ptr<uint64_t> primary) {
      return selected().idx128.next_secondary(iterator, *primary);
   }
   int32_t db_idx128_previous(int32_t iterator, wasm_ptr<uint64_t> primary) {
      return selected().idx128.previous_secondary(iterator, *primary);
   }
   // DB_WRAPPERS_ARRAY_SECONDARY(idx256, 2, unsigned __int128)
   // DB_WRAPPERS_FLOAT_SECONDARY(idx_double, float64_t)
   // DB_WRAPPERS_FLOAT_SECONDARY(idx_long_double, float128_t)
   // clang-format on

   uint32_t tester_sign(span<const char> private_key, const void* hash_val, span<char> signature)
   {
      auto k = unpack<fc::crypto::private_key>(private_key);
      fc::sha256 hash;
      std::memcpy(hash.data(), hash_val, hash.data_size());
      auto sig = k.sign(hash);
      auto data = fc::raw::pack(sig);
      std::memcpy(signature.data(), data.data(), std::min(signature.size(), data.size()));
      return data.size();
   }

   void sha1(span<const char> data, void* hash_val)
   {
      auto hash = fc::sha1::hash(data.data(), data.size());
      check_bounds(hash_val, hash.data_size());
      std::memcpy(hash_val, hash.data(), hash.data_size());
   }

   void sha256(span<const char> data, void* hash_val)
   {
      auto hash = fc::sha256::hash(data.data(), data.size());
      check_bounds(hash_val, hash.data_size());
      std::memcpy(hash_val, hash.data(), hash.data_size());
   }

   void sha512(span<const char> data, void* hash_val)
   {
      auto hash = fc::sha512::hash(data.data(), data.size());
      check_bounds(hash_val, hash.data_size());
      std::memcpy(hash_val, hash.data(), hash.data_size());
   }

   void ripemd160(span<const char> data, void* hash_val)
   {
      auto hash = fc::ripemd160::hash(data.data(), data.size());
      check_bounds(hash_val, hash.data_size());
      std::memcpy(hash_val, hash.data(), hash.data_size());
   }
};  // callbacks

callbacks* callbacks::single = nullptr;  // TODO: remove

void backtrace()
{
   if (callbacks::single)
      callbacks::single->backtrace();
}

#define DB_REGISTER_SECONDARY(IDX)                                                         \
   rhf_t::add<&callbacks::db_##IDX##_find_secondary>("env", "db_" #IDX "_find_secondary"); \
   rhf_t::add<&callbacks::db_##IDX##_find_primary>("env", "db_" #IDX "_find_primary");     \
   rhf_t::add<&callbacks::db_##IDX##_lowerbound>("env", "db_" #IDX "_lowerbound");         \
   rhf_t::add<&callbacks::db_##IDX##_upperbound>("env", "db_" #IDX "_upperbound");         \
   rhf_t::add<&callbacks::db_##IDX##_end>("env", "db_" #IDX "_end");                       \
   rhf_t::add<&callbacks::db_##IDX##_next>("env", "db_" #IDX "_next");                     \
   rhf_t::add<&callbacks::db_##IDX##_previous>("env", "db_" #IDX "_previous");

void register_callbacks()
{
   rhf_t::add<&callbacks::tester_abort>("env", "tester_abort");
   rhf_t::add<&callbacks::eosio_exit>("env", "eosio_exit");
   rhf_t::add<&callbacks::eosio_assert_message>("env", "eosio_assert_message");
   rhf_t::add<&callbacks::prints_l>("env", "prints_l");
   rhf_t::add<&callbacks::tester_get_arg_counts>("env", "tester_get_arg_counts");
   rhf_t::add<&callbacks::tester_get_args>("env", "tester_get_args");
   rhf_t::add<&callbacks::tester_clock_time_get>("env", "tester_clock_time_get");
   rhf_t::add<&callbacks::tester_fdstat_get>("env", "tester_fdstat_get");
   rhf_t::add<&callbacks::tester_open_file>("env", "tester_open_file");
   rhf_t::add<&callbacks::tester_close_file>("env", "tester_close_file");
   rhf_t::add<&callbacks::tester_write_file>("env", "tester_write_file");
   rhf_t::add<&callbacks::tester_read_file>("env", "tester_read_file");
   rhf_t::add<&callbacks::tester_read_whole_file>("env", "tester_read_whole_file");
   rhf_t::add<&callbacks::tester_execute>("env", "tester_execute");
   rhf_t::add<&callbacks::tester_create_chain>("env", "tester_create_chain");
   rhf_t::add<&callbacks::tester_destroy_chain>("env", "tester_destroy_chain");
   rhf_t::add<&callbacks::tester_shutdown_chain>("env", "tester_shutdown_chain");
   rhf_t::add<&callbacks::tester_get_chain_path>("env", "tester_get_chain_path");
   rhf_t::add<&callbacks::tester_replace_producer_keys>("env", "tester_replace_producer_keys");
   rhf_t::add<&callbacks::tester_replace_account_keys>("env", "tester_replace_account_keys");
   rhf_t::add<&callbacks::tester_start_block>("env", "tester_start_block");
   rhf_t::add<&callbacks::tester_finish_block>("env", "tester_finish_block");
   rhf_t::add<&callbacks::tester_get_head_block_info>("env", "tester_get_head_block_info");
   rhf_t::add<&callbacks::tester_push_transaction>("env", "tester_push_transaction");
   rhf_t::add<&callbacks::tester_exec_deferred>("env", "tester_exec_deferred");
   rhf_t::add<&callbacks::tester_get_history>("env", "tester_get_history");
   rhf_t::add<&callbacks::tester_select_chain_for_db>("env", "tester_select_chain_for_db");

   rhf_t::add<&callbacks::tester_create_rodeos>("env", "tester_create_rodeos");
   rhf_t::add<&callbacks::tester_destroy_rodeos>("env", "tester_destroy_rodeos");
   rhf_t::add<&callbacks::tester_rodeos_add_filter>("env", "tester_rodeos_add_filter");
   rhf_t::add<&callbacks::tester_rodeos_enable_queries>("env", "tester_rodeos_enable_queries");
   rhf_t::add<&callbacks::tester_connect_rodeos>("env", "tester_connect_rodeos");
   rhf_t::add<&callbacks::tester_rodeos_sync_block>("env", "tester_rodeos_sync_block");
   rhf_t::add<&callbacks::tester_rodeos_push_transaction>("env", "tester_rodeos_push_transaction");
   rhf_t::add<&callbacks::tester_rodeos_get_num_pushed_data>("env",
                                                             "tester_rodeos_get_num_pushed_data");
   rhf_t::add<&callbacks::tester_rodeos_get_pushed_data>("env", "tester_rodeos_get_pushed_data");

   rhf_t::add<&callbacks::db_get_i64>("env", "db_get_i64");
   rhf_t::add<&callbacks::db_next_i64>("env", "db_next_i64");
   rhf_t::add<&callbacks::db_previous_i64>("env", "db_previous_i64");
   rhf_t::add<&callbacks::db_find_i64>("env", "db_find_i64");
   rhf_t::add<&callbacks::db_lowerbound_i64>("env", "db_lowerbound_i64");
   rhf_t::add<&callbacks::db_upperbound_i64>("env", "db_upperbound_i64");
   rhf_t::add<&callbacks::db_end_i64>("env", "db_end_i64");
   DB_REGISTER_SECONDARY(idx64)
   DB_REGISTER_SECONDARY(idx128)
   // DB_REGISTER_SECONDARY(idx256)
   // DB_REGISTER_SECONDARY(idx_double)
   // DB_REGISTER_SECONDARY(idx_long_double)
   rhf_t::add<&callbacks::tester_sign>("env", "tester_sign");
   rhf_t::add<&callbacks::sha1>("env", "sha1");
   rhf_t::add<&callbacks::sha256>("env", "sha256");
   rhf_t::add<&callbacks::sha512>("env", "sha512");
   rhf_t::add<&callbacks::ripemd160>("env", "ripemd160");
}

void fill_substitutions(::state& state, const std::map<std::string, std::string>& substitutions)
{
   for (auto& [a, b] : substitutions)
   {
      std::vector<uint8_t> acode;
      std::vector<uint8_t> bcode;
      try
      {
         acode = eosio::vm::read_wasm(a);
      }
      catch (...)
      {
         std::cerr << "skipping substitution: can not read " << a << "\n";
         continue;
      }
      try
      {
         bcode = eosio::vm::read_wasm(b);
      }
      catch (...)
      {
         std::cerr << "skipping substitution: can not read " << b << "\n";
         continue;
      }
      auto ahash = fc::sha256::hash((const char*)acode.data(), acode.size());
      auto bhash = fc::sha256::hash((const char*)bcode.data(), bcode.size());
      state.substitutions[ahash] = bhash;
      state.codes[bhash] = std::move(bcode);
   }
}

static void run(const char* wasm,
                const std::vector<std::string>& args,
                const std::map<std::string, std::string>& substitutions)
{
   eosio::vm::wasm_allocator wa;
   auto code = eosio::vm::read_wasm(wasm);
   backend_t backend(code, nullptr);
   auto dwarf_info = dwarf::get_info_from_wasm({(const char*)code.data(), code.size()});
   auto reg = debug_eos_vm::enable_debug(code, backend, dwarf_info, "_start");

   ::state state{wasm, dwarf_info, wa, backend, args};
   fill_substitutions(state, substitutions);
   callbacks cb{state};
   state.files.emplace_back(stdin, false);
   state.files.emplace_back(stdout, false);
   state.files.emplace_back(stderr, false);
   state.files.emplace_back();  // reserve space for fd 3: root dir
   backend.set_wasm_allocator(&wa);

   rhf_t::resolve(backend.get_module());
   backend.initialize(&cb);
   backend(cb, "env", "_start");
}

const char usage[] = "USAGE: cltester [OPTIONS] file.wasm [args for wasm]...\n";
const char help[] = R"(
OPTIONS:
      -h, --help

            Show this message

      -v, --verbose

            Show detailed logging

      -s contract.wasm debug.wasm
      --subst contract.wasm debug.wasm

            Whenever contract.wasm needs to run, substitute debug.wasm in its
            place and enable debugging support. This bypasses size limits and
            other constraints on debug.wasm. eosiolib still enforces
            constraints on contract.wasm. (repeatable)
)";

int main(int argc, char* argv[])
{
   fc::logger::get(DEFAULT_LOGGER).set_log_level(fc::log_level::off);

   bool show_usage = false;
   bool error = false;
   std::map<std::string, std::string> substitutions;
   int next_arg = 1;
   while (next_arg < argc && argv[next_arg][0] == '-')
   {
      if (!strcmp(argv[next_arg], "-h") || !strcmp(argv[next_arg], "--help"))
         show_usage = true;
      else if (!strcmp(argv[next_arg], "-v") || !strcmp(argv[next_arg], "--verbose"))
         fc::logger::get(DEFAULT_LOGGER).set_log_level(fc::log_level::debug);
      else if (!strcmp(argv[next_arg], "-s") || !strcmp(argv[next_arg], "--subst"))
      {
         next_arg += 2;
         if (next_arg >= argc)
         {
            std::cerr << argv[next_arg - 2] << " needs 2 args\n";
            error = true;
         }
         else
         {
            substitutions[argv[next_arg - 1]] = argv[next_arg];
         }
      }
      else
      {
         std::cerr << "unknown option: " << argv[next_arg] << "\n";
         error = true;
      }
      ++next_arg;
   }
   if (next_arg >= argc)
      error = true;
   if (show_usage || error)
   {
      std::cerr << usage;
      if (show_usage)
         std::cerr << help;
      return error;
   }
   try
   {
      std::vector<std::string> args{argv + next_arg, argv + argc};
      register_callbacks();
      run(argv[next_arg], args, substitutions);
      return 0;
   }
   catch (::assert_exception& e)
   {
      std::cerr << "tester wasm asserted: " << e.what() << "\n";
   }
   catch (eosio::vm::exception& e)
   {
      std::cerr << "vm::exception: " << e.detail() << "\n";
   }
   catch (fc::exception& e)
   {
      std::cerr << "fc::exception: " << e.to_string() << "\n";
   }
   catch (std::exception& e)
   {
      std::cerr << "std::exception: " << e.what() << "\n";
   }
   return 1;
}
