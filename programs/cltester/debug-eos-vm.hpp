#pragma once

#define EOSIO_EOS_VM_JIT_RUNTIME_ENABLED

// TODO
#define private public
#include <eosio/vm/backend.hpp>
#undef private

namespace debug_eos_vm
{
   // TODO: This can be dropped if binary_parser gains additional imap.* calls
   template <typename Writer, typename Options, typename DebugInfo>
   struct capture_fn_parser : eosio::vm::binary_parser<Writer, Options, DebugInfo>
   {
      using base = eosio::vm::binary_parser<Writer, Options, DebugInfo>;

      using base::base;

      inline eosio::vm::module& parse_module(eosio::vm::wasm_code& code,
                                             eosio::vm::module& mod,
                                             DebugInfo& debug)
      {
         eosio::vm::wasm_code_ptr cp(code.data(), code.size());
         parse_module(cp, code.size(), mod, debug);
         return mod;
      }

      inline eosio::vm::module& parse_module2(eosio::vm::wasm_code_ptr& code_ptr,
                                              size_t sz,
                                              eosio::vm::module& mod,
                                              DebugInfo& debug)
      {
         parse_module(code_ptr, sz, mod, debug);
         return mod;
      }

      void parse_module(eosio::vm::wasm_code_ptr& code_ptr,
                        size_t sz,
                        eosio::vm::module& mod,
                        DebugInfo& debug)
      {
         this->_mod = &mod;
         EOS_VM_ASSERT(this->parse_magic(code_ptr) == eosio::vm::constants::magic,
                       eosio::vm::wasm_parse_exception, "magic number did not match");
         EOS_VM_ASSERT(this->parse_version(code_ptr) == eosio::vm::constants::version,
                       eosio::vm::wasm_parse_exception, "version number did not match");
         uint8_t highest_section_id = 0;
         for (;;)
         {
            if (code_ptr.offset() == sz)
               break;
            auto id = this->parse_section_id(code_ptr);
            auto len = this->parse_section_payload_len(code_ptr);

            EOS_VM_ASSERT(id == 0 || id > highest_section_id, eosio::vm::wasm_parse_exception,
                          "section out of order");
            highest_section_id = std::max(highest_section_id, id);

            auto section_guard = code_ptr.scoped_consume_items(len);

            switch (id)
            {
               case eosio::vm::section_id::custom_section:
                  this->parse_custom(code_ptr);
                  break;
               case eosio::vm::section_id::type_section:
                  this->template parse_section<eosio::vm::section_id::type_section>(code_ptr,
                                                                                    mod.types);
                  break;
               case eosio::vm::section_id::import_section:
                  this->template parse_section<eosio::vm::section_id::import_section>(code_ptr,
                                                                                      mod.imports);
                  break;
               case eosio::vm::section_id::function_section:
                  this->template parse_section<eosio::vm::section_id::function_section>(
                      code_ptr, mod.functions);
                  mod.normalize_types();
                  break;
               case eosio::vm::section_id::table_section:
                  this->template parse_section<eosio::vm::section_id::table_section>(code_ptr,
                                                                                     mod.tables);
                  break;
               case eosio::vm::section_id::memory_section:
                  this->template parse_section<eosio::vm::section_id::memory_section>(code_ptr,
                                                                                      mod.memories);
                  break;
               case eosio::vm::section_id::global_section:
                  this->template parse_section<eosio::vm::section_id::global_section>(code_ptr,
                                                                                      mod.globals);
                  break;
               case eosio::vm::section_id::export_section:
                  this->template parse_section<eosio::vm::section_id::export_section>(code_ptr,
                                                                                      mod.exports);
                  this->validate_exports();
                  break;
               case eosio::vm::section_id::start_section:
                  this->template parse_section<eosio::vm::section_id::start_section>(code_ptr,
                                                                                     mod.start);
                  break;
               case eosio::vm::section_id::element_section:
                  this->template parse_section<eosio::vm::section_id::element_section>(
                      code_ptr, mod.elements);
                  break;
               case eosio::vm::section_id::code_section:
                  this->template parse_section<eosio::vm::section_id::code_section>(code_ptr,
                                                                                    mod.code);
                  break;
               case eosio::vm::section_id::data_section:
                  this->template parse_section<eosio::vm::section_id::data_section>(code_ptr,
                                                                                    mod.data);
                  break;
               default:
                  EOS_VM_ASSERT(false, eosio::vm::wasm_parse_exception, "error invalid section id");
            }
         }
         EOS_VM_ASSERT(this->_mod->code.size() == this->_mod->functions.size(),
                       eosio::vm::wasm_parse_exception,
                       "code section must have the same size as the function section");

         debug.set(std::move(this->imap));
         debug.relocate(this->_allocator.get_code_start());
      }  // parse_module

      using base::parse_section;

      template <uint8_t id>
      inline void parse_section(
          eosio::vm::wasm_code_ptr& code,
          eosio::vm::guarded_vector<
              typename std::enable_if_t<id == eosio::vm::section_id::code_section,
                                        eosio::vm::function_body>>& elems)
      {
         const void* code_start = code.raw() - code.offset();
         this->parse_section_impl(
             code, elems, eosio::vm::detail::get_max_function_section_elements(this->_options),
             [&](eosio::vm::wasm_code_ptr& code, eosio::vm::function_body& fb, std::size_t idx) {
                this->parse_function_body(code, fb, idx);
             });
         EOS_VM_ASSERT(elems.size() == this->_mod->functions.size(),
                       eosio::vm::wasm_parse_exception,
                       "code section must have the same size as the function section");
         Writer code_writer(this->_allocator, code.bounds() - code.offset(), *this->_mod);
         this->imap.on_code_start(code_writer.get_base_addr(), code_start);
         for (size_t i = 0; i < this->_function_bodies.size(); i++)
         {
            eosio::vm::function_body& fb = this->_mod->code[i];
            eosio::vm::func_type& ft = this->_mod->types.at(this->_mod->functions.at(i));
            typename base::local_types_t local_types(ft, fb.locals);
            this->imap.on_function_start(code_writer.get_addr(),
                                         this->_function_bodies[i].first.raw());
            code_writer.emit_prologue(ft, fb.locals, i);
            this->imap.on_function_body(code_writer.get_addr());
            this->parse_function_body_code(this->_function_bodies[i].first, fb.size,
                                           this->_function_bodies[i].second, code_writer, ft,
                                           local_types);
            this->imap.on_function_epilogue(code_writer.get_addr());
            code_writer.emit_epilogue(ft, fb.locals, i);
            this->imap.on_function_end(code_writer.get_addr(),
                                       this->_function_bodies[i].first.bnds);
            code_writer.finalize(fb);
         }
         this->imap.on_code_end(code_writer.get_addr(), code.raw());
      }
   };  // capture_fn_parser

   struct jit_capture_fn
   {
      template <typename Host>
      using context = eosio::vm::jit_execution_context<Host, true>;
      template <typename Host, typename Options, typename DebugInfo>
      using parser =
          capture_fn_parser<eosio::vm::machine_code_writer<context<Host>>, Options, DebugInfo>;
      static constexpr bool is_jit = true;
   };

   struct debug_instr_map
   {
      using builder = debug_instr_map;

      const void* code_begin = nullptr;
      const void* wasm_begin = nullptr;
      size_t wasm_size = 0;
      size_t code_size = 0;

      struct fn_loc
      {
         uint32_t code_prologue = 0;
         uint32_t code_body = 0;
         uint32_t code_epilogue = 0;
         uint32_t code_end = 0;

         uint32_t wasm_begin = 0;
         uint32_t wasm_end = 0;
      };
      std::vector<fn_loc> fn_locs;

      struct instr_loc
      {
         uint32_t code_offset;
         uint32_t wasm_addr;

         friend bool operator<(const instr_loc& a, const instr_loc& b)
         {
            return a.code_offset < b.code_offset;
         }
      };
      std::vector<instr_loc> instr_locs;
      const instr_loc* offset_to_addr = nullptr;
      std::size_t offset_to_addr_len = 0;

      uint32_t code_offset(const void* p)
      {
         return reinterpret_cast<const char*>(p) - reinterpret_cast<const char*>(code_begin);
      }

      uint32_t wasm_offset(const void* p)
      {
         return reinterpret_cast<const char*>(p) - reinterpret_cast<const char*>(wasm_begin);
      }

      void on_code_start(const void* code_addr, const void* wasm_addr)
      {
         code_begin = code_addr;
         wasm_begin = wasm_addr;
      }

      void on_function_start(const void* code_addr, const void* wasm_addr)
      {
         fn_locs.emplace_back();
         fn_locs.back().code_prologue = code_offset(code_addr);
         fn_locs.back().wasm_begin = wasm_offset(wasm_addr);
      }

      void on_function_body(const void* code_addr)
      {
         fn_locs.back().code_body = code_offset(code_addr);
      }

      void on_function_epilogue(const void* code_addr)
      {
         fn_locs.back().code_epilogue = code_offset(code_addr);
      }

      void on_function_end(const void* code_addr, const void* wasm_addr)
      {
         fn_locs.back().code_end = code_offset(code_addr);
         fn_locs.back().wasm_end = wasm_offset(wasm_addr);
      }

      void on_instr_start(const void* code_addr, const void* wasm_addr)
      {
         instr_locs.push_back({code_offset(code_addr), wasm_offset(wasm_addr)});
      }

      void on_code_end(const void* code_addr, const void* wasm_addr)
      {
         code_size = (const char*)code_addr - (const char*)code_begin;
         wasm_size = (const char*)wasm_addr - (const char*)wasm_begin;
      }

      void set(builder&& b)
      {
         *this = std::move(b);

         {
            uint32_t code = 0;
            uint32_t wasm = 0;
            for (auto& fn : fn_locs)
            {
               EOS_VM_ASSERT(code <= fn.code_prologue &&              //
                                 fn.code_prologue <= fn.code_body &&  //
                                 fn.code_body <= fn.code_epilogue &&  //
                                 fn.code_epilogue <= fn.code_end,
                             eosio::vm::profile_exception, "function parts are out of order");
               EOS_VM_ASSERT(wasm <= fn.wasm_begin && fn.wasm_begin <= fn.wasm_end,
                             eosio::vm::profile_exception, "function wasm is out of order");
               code = fn.code_end;
               wasm = fn.wasm_end;
            }
         }

         {
            uint32_t code = 0;
            uint32_t wasm = 0;
            for (auto& instr : instr_locs)
            {
               EOS_VM_ASSERT(code <= instr.code_offset, eosio::vm::profile_exception,
                             "jit instructions are out of order");
               EOS_VM_ASSERT(wasm <= instr.wasm_addr, eosio::vm::profile_exception,
                             "jit instructions are out of order");
               code = instr.code_offset;
               wasm = instr.wasm_addr;
            }
         }

         offset_to_addr = instr_locs.data();
         offset_to_addr_len = instr_locs.size();
      }

      void relocate(const void* new_base) { code_begin = new_base; }

      // Cannot use most of the standard library as the STL is not async-signal-safe
      std::uint32_t translate(const void* pc) const
      {
         std::size_t diff = (reinterpret_cast<const char*>(pc) -
                             reinterpret_cast<const char*>(code_begin));  // negative values wrap
         if (diff >= code_size || diff < offset_to_addr[0].code_offset)
            return 0xFFFFFFFFu;
         std::uint32_t code_offset = diff;

         // Loop invariant: offset_to_addr[lower].code_offset <= code_offset < offset_to_addr[upper].code_offset
         std::size_t lower = 0, upper = offset_to_addr_len;
         while (upper - lower > 1)
         {
            std::size_t mid = lower + (upper - lower) / 2;
            if (offset_to_addr[mid].code_offset <= code_offset)
               lower = mid;
            else
               upper = mid;
         }

         return offset_to_addr[lower].wasm_addr;
      }
   };  // debug_instr_map

}  // namespace debug_eos_vm
