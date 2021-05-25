#include "dwarf.hpp"

#include <eosio/from_bin.hpp>
#include <eosio/vm/constants.hpp>
#include <eosio/vm/sections.hpp>

#include <cxxabi.h>
#include <elf.h>
#include <stdio.h>

namespace
{
   template <class... Ts>
   struct overloaded : Ts...
   {
      using Ts::operator()...;
   };
   template <class... Ts>
   overloaded(Ts...) -> overloaded<Ts...>;
}  // namespace

#define ENUM_DECL(prefix, type, name, value) inline constexpr type prefix##name = value;
#define ENUM_DECODE(prefix, _, name, value) \
   case value:                              \
      return prefix #name;

namespace dwarf
{
   inline constexpr uint8_t lns_version = 4;
   inline constexpr uint8_t compile_unit_version = 4;

   inline constexpr uint8_t dw_lns_copy = 0x01;
   inline constexpr uint8_t dw_lns_advance_pc = 0x02;
   inline constexpr uint8_t dw_lns_advance_line = 0x03;
   inline constexpr uint8_t dw_lns_set_file = 0x04;
   inline constexpr uint8_t dw_lns_set_column = 0x05;
   inline constexpr uint8_t dw_lns_negate_stmt = 0x06;
   inline constexpr uint8_t dw_lns_set_basic_block = 0x07;
   inline constexpr uint8_t dw_lns_const_add_pc = 0x08;
   inline constexpr uint8_t dw_lns_fixed_advance_pc = 0x09;
   inline constexpr uint8_t dw_lns_set_prologue_end = 0x0a;
   inline constexpr uint8_t dw_lns_set_epilogue_begin = 0x0b;
   inline constexpr uint8_t dw_lns_set_isa = 0x0c;

   inline constexpr uint8_t dw_lne_end_sequence = 0x01;
   inline constexpr uint8_t dw_lne_set_address = 0x02;
   inline constexpr uint8_t dw_lne_define_file = 0x03;
   inline constexpr uint8_t dw_lne_set_discriminator = 0x04;
   inline constexpr uint8_t dw_lne_lo_user = 0x80;
   inline constexpr uint8_t dw_lne_hi_user = 0xff;

// clang-format off
#define DW_ATS(a, b, x)                \
   x(a, b, sibling, 0x01)              \
   x(a, b, location, 0x02)             \
   x(a, b, name, 0x03)                 \
   x(a, b, ordering, 0x09)             \
   x(a, b, byte_size, 0x0b)            \
   x(a, b, bit_offset, 0x0c)           \
   x(a, b, bit_size, 0x0d)             \
   x(a, b, stmt_list, 0x10)            \
   x(a, b, low_pc, 0x11)               \
   x(a, b, high_pc, 0x12)              \
   x(a, b, language, 0x13)             \
   x(a, b, discr, 0x15)                \
   x(a, b, discr_value, 0x16)          \
   x(a, b, visibility, 0x17)           \
   x(a, b, import, 0x18)               \
   x(a, b, string_length, 0x19)        \
   x(a, b, common_reference, 0x1a)     \
   x(a, b, comp_dir, 0x1b)             \
   x(a, b, const_value, 0x1c)          \
   x(a, b, containing_type, 0x1d)      \
   x(a, b, default_value, 0x1e)        \
   x(a, b, inline, 0x20)               \
   x(a, b, is_optional, 0x21)          \
   x(a, b, lower_bound, 0x22)          \
   x(a, b, producer, 0x25)             \
   x(a, b, prototyped, 0x27)           \
   x(a, b, return_addr, 0x2a)          \
   x(a, b, start_scope, 0x2c)          \
   x(a, b, bit_stride, 0x2e)           \
   x(a, b, upper_bound, 0x2f)          \
   x(a, b, abstract_origin, 0x31)      \
   x(a, b, accessibility, 0x32)        \
   x(a, b, address_class, 0x33)        \
   x(a, b, artificial, 0x34)           \
   x(a, b, base_types, 0x35)           \
   x(a, b, calling_convention, 0x36)   \
   x(a, b, count, 0x37)                \
   x(a, b, data_member_location, 0x38) \
   x(a, b, decl_column, 0x39)          \
   x(a, b, decl_file, 0x3a)            \
   x(a, b, decl_line, 0x3b)            \
   x(a, b, declaration, 0x3c)          \
   x(a, b, discr_list, 0x3d)           \
   x(a, b, encoding, 0x3e)             \
   x(a, b, external, 0x3f)             \
   x(a, b, frame_base, 0x40)           \
   x(a, b, friend, 0x41)               \
   x(a, b, identifier_case, 0x42)      \
   x(a, b, macro_info, 0x43)           \
   x(a, b, namelist_item, 0x44)        \
   x(a, b, priority, 0x45)             \
   x(a, b, segment, 0x46)              \
   x(a, b, specification, 0x47)        \
   x(a, b, static_link, 0x48)          \
   x(a, b, type, 0x49)                 \
   x(a, b, use_location, 0x4a)         \
   x(a, b, variable_parameter, 0x4b)   \
   x(a, b, virtuality, 0x4c)           \
   x(a, b, vtable_elem_location, 0x4d) \
   x(a, b, allocated, 0x4e)            \
   x(a, b, associated, 0x4f)           \
   x(a, b, data_location, 0x50)        \
   x(a, b, byte_stride, 0x51)          \
   x(a, b, entry_pc, 0x52)             \
   x(a, b, use_UTF8, 0x53)             \
   x(a, b, extension, 0x54)            \
   x(a, b, ranges, 0x55)               \
   x(a, b, trampoline, 0x56)           \
   x(a, b, call_column, 0x57)          \
   x(a, b, call_file, 0x58)            \
   x(a, b, call_line, 0x59)            \
   x(a, b, description, 0x5a)          \
   x(a, b, binary_scale, 0x5b)         \
   x(a, b, decimal_scale, 0x5c)        \
   x(a, b, small, 0x5d)                \
   x(a, b, decimal_sign, 0x5e)         \
   x(a, b, digit_count, 0x5f)          \
   x(a, b, picture_string, 0x60)       \
   x(a, b, mutable, 0x61)              \
   x(a, b, threads_scaled, 0x62)       \
   x(a, b, explicit, 0x63)             \
   x(a, b, object_pointer, 0x64)       \
   x(a, b, endianity, 0x65)            \
   x(a, b, elemental, 0x66)            \
   x(a, b, pure, 0x67)                 \
   x(a, b, recursive, 0x68)            \
   x(a, b, signature, 0x69)            \
   x(a, b, main_subprogram, 0x6a)      \
   x(a, b, data_bit_offset, 0x6b)      \
   x(a, b, const_expr, 0x6c)           \
   x(a, b, enum_class, 0x6d)           \
   x(a, b, linkage_name, 0x6e)         \
   x(a, b, lo_user, 0x2000)            \
   x(a, b, hi_user, 0x3fff)
   // clang-format on

   DW_ATS(dw_at_, uint16_t, ENUM_DECL)
   std::string dw_at_to_str(uint16_t value)
   {
      switch (value)
      {
         DW_ATS("DW_AT_", _, ENUM_DECODE)
         default:
            return "DW_AT_" + std::to_string(value);
      }
   }

// clang-format off
#define DW_FORMS(a, b, x)           \
   x(a, b, addr, 0x01)              \
   x(a, b, block2, 0x03)            \
   x(a, b, block4, 0x04)            \
   x(a, b, data2, 0x05)             \
   x(a, b, data4, 0x06)             \
   x(a, b, data8, 0x07)             \
   x(a, b, string, 0x08)            \
   x(a, b, block, 0x09)             \
   x(a, b, block1, 0x0a)            \
   x(a, b, data1, 0x0b)             \
   x(a, b, flag, 0x0c)              \
   x(a, b, sdata, 0x0d)             \
   x(a, b, strp, 0x0e)              \
   x(a, b, udata, 0x0f)             \
   x(a, b, ref_addr, 0x10)          \
   x(a, b, ref1, 0x11)              \
   x(a, b, ref2, 0x12)              \
   x(a, b, ref4, 0x13)              \
   x(a, b, ref8, 0x14)              \
   x(a, b, ref_udata, 0x15)         \
   x(a, b, indirect, 0x16)          \
   x(a, b, sec_offset, 0x17)        \
   x(a, b, exprloc, 0x18)           \
   x(a, b, flag_present, 0x19)      \
   x(a, b, ref_sig8, 0x20)
   // clang-format on

   DW_FORMS(dw_form_, uint8_t, ENUM_DECL)
   std::string dw_form_to_str(uint8_t value)
   {
      switch (value)
      {
         DW_FORMS("DW_FORM_", _, ENUM_DECODE)
         default:
            return "DW_FORM_" + std::to_string(value);
      }
   }

// clang-format off
#define DW_TAGS(a, b, x)                     \
   x(a, b, array_type, 0x01)                 \
   x(a, b, class_type, 0x02)                 \
   x(a, b, entry_point, 0x03)                \
   x(a, b, enumeration_type, 0x04)           \
   x(a, b, formal_parameter, 0x05)           \
   x(a, b, imported_declaration, 0x08)       \
   x(a, b, label, 0x0a)                      \
   x(a, b, lexical_block, 0x0b)              \
   x(a, b, member, 0x0d)                     \
   x(a, b, pointer_type, 0x0f)               \
   x(a, b, reference_type, 0x10)             \
   x(a, b, compile_unit, 0x11)               \
   x(a, b, string_type, 0x12)                \
   x(a, b, structure_type, 0x13)             \
   x(a, b, subroutine_type, 0x15)            \
   x(a, b, typedef, 0x16)                    \
   x(a, b, union_type, 0x17)                 \
   x(a, b, unspecified_parameters, 0x18)     \
   x(a, b, variant, 0x19)                    \
   x(a, b, common_block, 0x1a)               \
   x(a, b, common_inclusion, 0x1b)           \
   x(a, b, inheritance, 0x1c)                \
   x(a, b, inlined_subroutine, 0x1d)         \
   x(a, b, module, 0x1e)                     \
   x(a, b, ptr_to_member_type, 0x1f)         \
   x(a, b, set_type, 0x20)                   \
   x(a, b, subrange_type, 0x21)              \
   x(a, b, with_stmt, 0x22)                  \
   x(a, b, access_declaration, 0x23)         \
   x(a, b, base_type, 0x24)                  \
   x(a, b, catch_block, 0x25)                \
   x(a, b, const_type, 0x26)                 \
   x(a, b, constant, 0x27)                   \
   x(a, b, enumerator, 0x28)                 \
   x(a, b, file_type, 0x29)                  \
   x(a, b, friend, 0x2a)                     \
   x(a, b, namelist, 0x2b)                   \
   x(a, b, namelist_item, 0x2c)              \
   x(a, b, packed_type, 0x2d)                \
   x(a, b, subprogram, 0x2e)                 \
   x(a, b, template_type_parameter, 0x2f)    \
   x(a, b, template_value_parameter, 0x30)   \
   x(a, b, thrown_type, 0x31)                \
   x(a, b, try_block, 0x32)                  \
   x(a, b, variant_part, 0x33)               \
   x(a, b, variable, 0x34)                   \
   x(a, b, volatile_type, 0x35)              \
   x(a, b, dwarf_procedure, 0x36)            \
   x(a, b, restrict_type, 0x37)              \
   x(a, b, interface_type, 0x38)             \
   x(a, b, namespace, 0x39)                  \
   x(a, b, imported_module, 0x3a)            \
   x(a, b, unspecified_type, 0x3b)           \
   x(a, b, partial_unit, 0x3c)               \
   x(a, b, imported_unit, 0x3d)              \
   x(a, b, condition, 0x3f)                  \
   x(a, b, shared_type, 0x40)                \
   x(a, b, type_unit, 0x41)                  \
   x(a, b, rvalue_reference_type, 0x42)      \
   x(a, b, template_alias, 0x43)             \
   x(a, b, lo_user, 0x4080)                  \
   x(a, b, hi_user, 0xfff  )
   // clang-format on

   DW_TAGS(dw_tag_, uint16_t, ENUM_DECL)
   std::string dw_tag_to_str(uint16_t value)
   {
      switch (value)
      {
         DW_TAGS("DW_TAG_", _, ENUM_DECODE)
         default:
            return "DW_TAG_" + std::to_string(value);
      }
   }

   struct line_state
   {
      uint8_t minimum_instruction_length = 0;
      uint8_t maximum_operations_per_instruction = 0;
      uint8_t default_is_stmt = 0;
      int8_t line_base = 0;
      uint8_t line_range = 0;
      uint8_t opcode_base = 0;
      std::vector<uint8_t> standard_opcode_lengths;
      std::vector<std::string> include_directories;
      std::vector<std::string> file_names;

      uint32_t address = 0;
      uint32_t op_index = 0;
      uint32_t file = 1;
      uint32_t line = 1;
      uint32_t column = 0;
      bool is_stmt = false;
      bool basic_block = false;
      bool end_sequence = false;
      bool prologue_end = false;
      bool epilogue_begin = false;
      uint32_t isa = 0;
      uint32_t discriminator = 0;
   };

   std::string_view get_string(eosio::input_stream& s)
   {
      auto begin = s.pos;
      while (true)
      {
         if (s.pos == s.end)
            throw std::runtime_error("error reading string in dwarf info");
         auto ch = *s.pos++;
         if (!ch)
            break;
      }
      return {begin, size_t(s.pos - begin - 1)};
   }

   void get_strings(std::vector<std::string>& v, eosio::input_stream& s)
   {
      while (true)
      {
         auto str = get_string(s);
         if (str.empty())
            break;
         v.push_back(std::string{str});
      }
   }

   void parse_debug_line_unit_header(line_state& state, eosio::input_stream& s)
   {
      auto version = eosio::from_bin<uint16_t>(s);
      eosio::check(version == lns_version, "bad version in .debug_line");
      uint32_t header_length = eosio::from_bin<uint32_t>(s);
      eosio::check(header_length <= s.remaining(), "bad header_length in .debug_line");
      auto instructions_pos = s.pos + header_length;

      eosio::from_bin(state.minimum_instruction_length, s);
      eosio::from_bin(state.maximum_operations_per_instruction, s);
      eosio::from_bin(state.default_is_stmt, s);
      eosio::from_bin(state.line_base, s);
      eosio::from_bin(state.line_range, s);
      eosio::from_bin(state.opcode_base, s);
      state.standard_opcode_lengths.push_back(0);
      for (int i = 1; i < state.opcode_base; ++i)
         state.standard_opcode_lengths.push_back(eosio::from_bin<uint8_t>(s));
      state.include_directories.push_back("");
      get_strings(state.include_directories, s);

      state.file_names.push_back("");
      while (true)
      {
         auto str = (std::string)get_string(s);
         if (str.empty())
            break;
         auto dir = eosio::varuint32_from_bin(s);
         auto mod_time = eosio::varuint32_from_bin(s);
         auto filesize = eosio::varuint32_from_bin(s);
         eosio::check(dir <= state.file_names.size(),
                      "invalid include_directory number in .debug_line");
         if (dir)
            str = state.include_directories[dir] + "/" + str;
         state.file_names.push_back(std::move(str));
      }

      eosio::check(instructions_pos == s.pos, "mismatched header_length in .debug_line");
   }

   void parse_debug_line_unit(info& result,
                              std::map<std::string, uint32_t>& files,
                              eosio::input_stream s)
   {
      line_state state;
      parse_debug_line_unit_header(state, s);
      eosio::check(state.minimum_instruction_length == 1,
                   "mismatched minimum_instruction_length in .debug_line");
      eosio::check(state.maximum_operations_per_instruction == 1,
                   "mismatched maximum_operations_per_instruction in .debug_line");
      state.is_stmt = state.default_is_stmt;
      auto initial_state = state;

      std::optional<location> current;
      auto add_row = [&] {
         if (current && (state.end_sequence || state.file != current->file_index ||
                         state.line != current->line))
         {
            current->end_address = state.address;
            eosio::check(current->file_index < state.file_names.size(),
                         "invalid file index in .debug_line");
            auto& filename = state.file_names[current->file_index];
            auto it = files.find(filename);
            if (it == files.end())
            {
               it = files.insert({filename, result.files.size()}).first;
               result.files.push_back(filename);
            }
            current->file_index = it->second;
            // fprintf(stderr, "[%08x,%08x) %s:%d\n", current->begin_address, current->end_address,
            //         result.files[current->file_index].c_str(), current->line);
            result.locations.push_back(*current);
            current = {};
         }
         if (!state.end_sequence && !current)
            current = location{.begin_address = state.address,
                               .end_address = state.address,
                               .file_index = state.file,
                               .line = state.line};
      };

      while (s.remaining())
      {
         auto opcode = eosio::from_bin<uint8_t>(s);
         if (!opcode)
         {
            auto size = eosio::varuint32_from_bin(s);
            eosio::check(size <= s.remaining(), "bytecode overrun in .debug_line");
            eosio::input_stream extended{s.pos, s.pos + size};
            s.skip(size);
            auto extended_opcode = eosio::from_bin<uint8_t>(extended);
            switch (extended_opcode)
            {
               case dw_lne_end_sequence:
                  state.end_sequence = true;
                  add_row();
                  state = initial_state;
                  break;
               case dw_lne_set_address:
                  state.address = eosio::from_bin<uint32_t>(extended);
                  state.op_index = 0;
                  break;
               case dw_lne_set_discriminator:
                  state.discriminator = eosio::varuint32_from_bin(extended);
                  break;
               default:
                  // fprintf(stderr, "extended opcode %d\n", (int)extended_opcode);
                  break;
            }
         }
         else if (opcode < state.opcode_base)
         {
            switch (opcode)
            {
               case dw_lns_copy:
                  add_row();
                  state.discriminator = 0;
                  state.basic_block = false;
                  state.prologue_end = false;
                  state.epilogue_begin = false;
                  break;
               case dw_lns_advance_pc:
                  state.address += eosio::varuint32_from_bin(s);
                  break;
               case dw_lns_advance_line:
                  state.line += sleb32_from_bin(s);
                  break;
               case dw_lns_set_file:
                  state.file = eosio::varuint32_from_bin(s);
                  break;
               case dw_lns_set_column:
                  state.column = eosio::varuint32_from_bin(s);
                  break;
               case dw_lns_negate_stmt:
                  state.is_stmt = !state.is_stmt;
                  break;
               case dw_lns_set_basic_block:
                  state.basic_block = true;
                  break;
               case dw_lns_const_add_pc:
                  state.address += (255 - state.opcode_base) / state.line_range;
                  break;
               case dw_lns_fixed_advance_pc:
                  state.address += eosio::from_bin<uint16_t>(s);
                  state.op_index = 0;
                  break;
               case dw_lns_set_prologue_end:
                  state.prologue_end = true;
                  break;
               case dw_lns_set_epilogue_begin:
                  state.epilogue_begin = true;
                  break;
               case dw_lns_set_isa:
                  state.isa = eosio::varuint32_from_bin(s);
                  break;
               default:
                  // fprintf(stderr, "opcode %d\n", (int)opcode);
                  // fprintf(stderr, "  args: %d\n", state.standard_opcode_lengths[opcode]);
                  // for (uint8_t i = 0; i < state.standard_opcode_lengths[opcode]; ++i)
                  //    eosio::varuint32_from_bin(s);
                  break;
            }
         }  // opcode < state.opcode_base
         else
         {
            state.address += (opcode - state.opcode_base) / state.line_range;
            state.line += state.line_base + ((opcode - state.opcode_base) % state.line_range);
            add_row();
            state.basic_block = false;
            state.prologue_end = false;
            state.epilogue_begin = false;
            state.discriminator = 0;
         }
      }  // while (s.remaining())
   }     // parse_debug_line_unit

   void parse_debug_line(info& result,
                         std::map<std::string, uint32_t>& files,
                         eosio::input_stream s)
   {
      while (s.remaining())
      {
         uint32_t unit_length = eosio::from_bin<uint32_t>(s);
         eosio::check(unit_length <= s.remaining(), "bad unit_length in .debug_line");
         parse_debug_line_unit(result, files, {s.pos, s.pos + unit_length});
         s.skip(unit_length);
      }
   }

   void parse_debug_abbrev(info& result,
                           std::map<std::string, uint32_t>& files,
                           eosio::input_stream s)
   {
      auto begin = s.pos;
      while (s.remaining())
      {
         uint32_t table_offset = s.pos - begin;
         while (true)
         {
            abbrev_decl decl;
            decl.table_offset = table_offset;
            decl.code = eosio::varuint32_from_bin(s);
            if (!decl.code)
               break;
            decl.tag = eosio::varuint32_from_bin(s);
            decl.has_children = eosio::from_bin<uint8_t>(s);
            while (true)
            {
               abbrev_attr attr;
               attr.name = eosio::varuint32_from_bin(s);
               attr.form = eosio::varuint32_from_bin(s);
               if (!attr.name)
                  break;
               decl.attrs.push_back(attr);
            }
            // printf("%08x [%d]: tag: %d children: %d attrs: %d\n", decl.table_offset, decl.code,
            //        decl.tag, decl.has_children, (int)decl.attrs.size());
            result.abbrev_decls.push_back(std::move(decl));
         }
      }
   }

   struct attr_address
   {
      uint32_t value = 0;
   };

   struct attr_block
   {
      eosio::input_stream data;
   };

   struct attr_data
   {
      uint64_t value = 0;
   };

   struct attr_exprloc
   {
      eosio::input_stream data;
   };

   struct attr_flag
   {
      bool value = false;
   };

   struct attr_sec_offset
   {
      uint32_t value = 0;
   };

   struct attr_ref
   {
      uint64_t value = 0;
   };

   struct attr_ref_addr
   {
      uint32_t value = 0;
   };

   struct attr_ref_sig8
   {
      uint64_t value = 0;
   };

   using attr_value = std::variant<  //
       attr_address,
       attr_block,
       attr_data,
       attr_exprloc,
       attr_flag,
       attr_sec_offset,
       attr_ref,
       attr_ref_addr,
       attr_ref_sig8,
       std::string_view>;

   std::string hex(uint32_t v)
   {
      char b[11];
      snprintf(b, sizeof(b), "0x%08x", v);
      return b;
   }

   std::string to_string(const attr_value& v)
   {
      overloaded o{
          [](const attr_address& s) { return hex(s.value); },        //
          [](const attr_sec_offset& s) { return hex(s.value); },     //
          [](const attr_ref& s) { return hex(s.value); },            //
          [](const std::string_view& s) { return (std::string)s; },  //
          [](const auto&) { return std::string{}; }                  //
      };
      return std::visit(o, v);
   }

   std::optional<uint32_t> get_address(const attr_value& v)
   {
      if (auto* x = std::get_if<attr_address>(&v))
         return x->value;
      return {};
   }

   std::optional<uint64_t> get_data(const attr_value& v)
   {
      if (auto* x = std::get_if<attr_data>(&v))
         return x->value;
      return {};
   }

   std::optional<uint64_t> get_ref(const attr_value& v)
   {
      if (auto* x = std::get_if<attr_ref>(&v))
         return x->value;
      return {};
   }

   std::optional<std::string_view> get_string(const attr_value& v)
   {
      if (auto* x = std::get_if<std::string_view>(&v))
         return *x;
      return {};
   }

   attr_value parse_attr_value(info& result, uint32_t form, eosio::input_stream& s)
   {
      auto vardata = [&](size_t size) {
         eosio::check(size < s.remaining(), "variable-length overrun in dwarf entry");
         eosio::input_stream result{s.pos, s.pos + size};
         s.skip(size);
         return result;
      };

      switch (form)
      {
         case dw_form_addr:
            return attr_address{eosio::from_bin<uint32_t>(s)};
         case dw_form_block:
            return attr_block{vardata(eosio::varuint32_from_bin(s))};
         case dw_form_block1:
            return attr_block{vardata(eosio::from_bin<uint8_t>(s))};
         case dw_form_block2:
            return attr_block{vardata(eosio::from_bin<uint16_t>(s))};
         case dw_form_block4:
            return attr_block{vardata(eosio::from_bin<uint32_t>(s))};
         case dw_form_sdata:
            return attr_data{(uint64_t)eosio::sleb64_from_bin(s)};
         case dw_form_udata:
            return attr_data{eosio::varuint64_from_bin(s)};
         case dw_form_data1:
            return attr_data{eosio::from_bin<uint8_t>(s)};
         case dw_form_data2:
            return attr_data{eosio::from_bin<uint16_t>(s)};
         case dw_form_data4:
            return attr_data{eosio::from_bin<uint32_t>(s)};
         case dw_form_data8:
            return attr_data{eosio::from_bin<uint64_t>(s)};
         case dw_form_exprloc:
            return attr_exprloc{vardata(eosio::varuint32_from_bin(s))};
         case dw_form_flag_present:
            return attr_flag{true};
         case dw_form_flag:
            return attr_flag{(bool)eosio::from_bin<uint8_t>(s)};
         case dw_form_sec_offset:
            return attr_sec_offset{eosio::from_bin<uint32_t>(s)};
         case dw_form_ref_udata:
            return attr_ref{eosio::varuint64_from_bin(s)};
         case dw_form_ref1:
            return attr_ref{eosio::from_bin<uint8_t>(s)};
         case dw_form_ref2:
            return attr_ref{eosio::from_bin<uint16_t>(s)};
         case dw_form_ref4:
            return attr_ref{eosio::from_bin<uint32_t>(s)};
         case dw_form_ref8:
            return attr_ref{eosio::from_bin<uint64_t>(s)};
         case dw_form_ref_addr:
            return attr_ref_addr{eosio::from_bin<uint32_t>(s)};
         case dw_form_ref_sig8:
            return attr_ref_sig8{eosio::from_bin<uint64_t>(s)};
         case dw_form_string:
            return get_string(s);
         case dw_form_strp:
            return std::string_view{result.get_str(eosio::from_bin<uint32_t>(s))};
         case dw_form_indirect:
            return parse_attr_value(result, eosio::varuint32_from_bin(s), s);
         default:
            throw std::runtime_error("unknown form in dwarf entry");
      }
   }  // parse_attr_value

   const abbrev_decl* get_die_abbrev(info& result,
                                     int indent,
                                     uint32_t debug_abbrev_offset,
                                     const eosio::input_stream& whole_s,
                                     eosio::input_stream& s)
   {
      const char* p = s.pos;
      auto code = eosio::varuint32_from_bin(s);
      if (!code)
      {
         // fprintf(stderr, "0x%08x: %*sNULL\n", uint32_t(p - whole_s.pos), indent - 12, "");
         return nullptr;
      }
      const auto* abbrev = result.get_abbrev_decl(debug_abbrev_offset, code);
      eosio::check(abbrev, "Bad abbrev in .debug_info");
      // fprintf(stderr, "0x%08x: %*s%s\n", uint32_t(p - whole_s.pos), indent - 12, "",
      //         dw_tag_to_str(abbrev->tag).c_str());
      return abbrev;
   }

   template <typename F>
   void parse_die_attrs(info& result,
                        int indent,
                        uint32_t debug_abbrev_offset,
                        const abbrev_decl& abbrev,
                        const eosio::input_stream& whole_s,
                        const eosio::input_stream& unit_s,
                        eosio::input_stream& s,
                        F&& f)
   {
      for (const auto& attr : abbrev.attrs)
      {
         auto value = parse_attr_value(result, attr.form, s);
         // fprintf(stderr, "%*s%s %s: %s\n", indent + 2, "", dw_at_to_str(attr.name).c_str(),
         //         dw_form_to_str(attr.form).c_str(), to_string(value).c_str());
         if (attr.name == dw_at_specification)
         {
            if (auto ref = get_ref(value))
            {
               // fprintf(stderr, "%*sref: %08x, unit: %08x\n", indent + 4, "", uint32_t(*ref),
               //         uint32_t(unit_s.pos - whole_s.pos));
               eosio::check(*ref < unit_s.remaining(), "DW_AT_specification out of range");
               eosio::input_stream ref_s{unit_s.pos + *ref, unit_s.end};
               auto ref_abbrev =
                   get_die_abbrev(result, indent + 4, debug_abbrev_offset, whole_s, ref_s);
               parse_die_attrs(result, indent + 4, debug_abbrev_offset, *ref_abbrev, whole_s,
                               unit_s, ref_s, f);
            }
         }
         else
            f(attr, value);
      }
   }

   std::string demangle(const std::string& name)
   {
      auto result = abi::__cxa_demangle(name.c_str(), nullptr, nullptr, nullptr);
      if (result)
      {
         std::string x = result;
         free(result);
         return x;
      }
      return name;
   }

   struct common_attrs
   {
      std::optional<uint32_t> low_pc;
      std::optional<uint32_t> high_pc;
      std::optional<std::string> linkage_name;
      std::optional<std::string> name;

      std::string get_name() const
      {
         if (linkage_name)
            return demangle(*linkage_name);
         if (name)
            return *name;
         return "";
      }

      void operator()(const abbrev_attr& attr, attr_value& value)
      {
         switch (attr.name)
         {
            case dw_at_low_pc:
               low_pc = get_address(value);
               break;
            case dw_at_high_pc:
               high_pc = get_address(value);
               if (low_pc && !high_pc)
               {
                  auto size = get_data(value);
                  if (size)
                     high_pc = *low_pc + *size;
               }
               break;
            case dw_at_linkage_name:
               linkage_name = get_string(value);
               break;
            case dw_at_name:
               name = get_string(value);
               break;
            default:
               break;
         }
      }
   };  // common_attrs

   void skip_die_children(info& result,
                          int indent,
                          uint32_t debug_abbrev_offset,
                          const abbrev_decl& abbrev,
                          const eosio::input_stream& whole_s,
                          const eosio::input_stream& unit_s,
                          eosio::input_stream& s)
   {
      if (!abbrev.has_children)
         return;
      while (true)
      {
         auto* child = get_die_abbrev(result, indent, debug_abbrev_offset, whole_s, s);
         if (!child)
            break;
         parse_die_attrs(result, indent + 4, debug_abbrev_offset, *child, whole_s, unit_s, s,
                         [&](auto&&...) {});
         skip_die_children(result, indent + 4, debug_abbrev_offset, *child, whole_s, unit_s, s);
      }
   }

   void parse_die_children(info& result,
                           uint32_t indent,
                           uint32_t debug_abbrev_offset,
                           const abbrev_decl& abbrev,
                           const eosio::input_stream& whole_s,
                           const eosio::input_stream& unit_s,
                           eosio::input_stream& s)
   {
      if (!abbrev.has_children)
         return;
      while (true)
      {
         auto* child = get_die_abbrev(result, indent, debug_abbrev_offset, whole_s, s);
         if (!child)
            break;
         common_attrs common;
         parse_die_attrs(result, indent + 4, debug_abbrev_offset, *child, whole_s, unit_s, s,
                         common);
         if (child->tag == dw_tag_subprogram)
         {
            auto name = common.get_name();
            if (!name.empty() && common.low_pc && *common.low_pc && common.high_pc)
            {
               subprogram p{
                   .begin_address = *common.low_pc,
                   .end_address = *common.high_pc,
                   .name = name,
               };
               result.subprograms.push_back(std::move(p));
            }
         }
         parse_die_children(result, indent + 4, debug_abbrev_offset, *child, whole_s, unit_s, s);
      }
   }  // parse_die_children

   void parse_debug_info_unit(info& result,
                              const eosio::input_stream& whole_s,
                              const eosio::input_stream& unit_s,
                              eosio::input_stream s)
   {
      uint32_t indent = 12;
      auto version = eosio::from_bin<uint16_t>(s);
      eosio::check(version == compile_unit_version, "bad version in .debug_info");
      auto debug_abbrev_offset = eosio::from_bin<uint32_t>(s);
      auto address_size = eosio::from_bin<uint8_t>(s);
      eosio::check(address_size == 4, "mismatched address_size in .debug_info");

      auto* root = get_die_abbrev(result, indent, debug_abbrev_offset, whole_s, s);
      eosio::check(root && root->tag == dw_tag_compile_unit,
                   "missing DW_TAG_type_unit in .debug_info");
      parse_die_attrs(result, indent + 4, debug_abbrev_offset, *root, whole_s, unit_s, s,
                      [&](auto&&...) {});
      parse_die_children(result, indent + 4, debug_abbrev_offset, *root, whole_s, unit_s, s);
   }  // parse_debug_info_unit

   void parse_debug_info(info& result, eosio::input_stream s)
   {
      auto whole_s = s;
      while (s.remaining())
      {
         auto unit_s = s;
         uint32_t unit_length = eosio::from_bin<uint32_t>(s);
         eosio::check(unit_length <= s.remaining(), "bad unit_length in .debug_info");
         parse_debug_info_unit(result, whole_s, unit_s, {s.pos, s.pos + unit_length});
         s.skip(unit_length);
      }
   }

   struct wasm_header
   {
      uint32_t magic = 0;
      uint32_t version = 0;
   };
   EOSIO_REFLECT(wasm_header, magic, version)

   struct wasm_section
   {
      uint8_t id = 0;
      eosio::input_stream data;
   };
   EOSIO_REFLECT(wasm_section, id, data)

   info get_info_from_wasm(eosio::input_stream stream)
   {
      info result;
      auto file_begin = stream.pos;
      std::map<std::string, uint32_t> files;

      wasm_header header;
      eosio::from_bin(header, stream);
      eosio::check(header.magic == eosio::vm::constants::magic,
                   "wasm file magic number does not match");
      eosio::check(header.version == eosio::vm::constants::version,
                   "wasm file version does not match");
      auto scan = [&](auto stream, auto f) {
         while (stream.remaining())
         {
            auto section_begin = stream.pos;
            auto section = eosio::from_bin<wasm_section>(stream);
            if (section.id == eosio::vm::section_id::code_section)
               result.code_offset = section_begin - file_begin;
            else if (section.id == eosio::vm::section_id::custom_section)
               f(section, eosio::from_bin<std::string>(section.data));
         }
      };

      scan(stream, [&](auto& section, const auto& name) {
         if (name == ".debug_line")
         {
            dwarf::parse_debug_line(result, files, section.data);
         }
         else if (name == ".debug_abbrev")
         {
            dwarf::parse_debug_abbrev(result, files, section.data);
         }
         else if (name == ".debug_str")
         {
            result.strings = std::vector<char>{section.data.pos, section.data.end};
            eosio::check(result.strings.empty() || result.strings.back() == 0,
                         ".debug_str is malformed");
         }
      });
      scan(stream, [&](auto& section, const auto& name) {
         if (name == ".debug_info")
            dwarf::parse_debug_info(result, section.data);
      });

      std::sort(result.locations.begin(), result.locations.end());
      std::sort(result.abbrev_decls.begin(), result.abbrev_decls.end());
      std::sort(result.subprograms.begin(), result.subprograms.end());
      // for (auto& loc : result.locations)
      //    fprintf(stderr, "[%08x,%08x) %s:%d\n", loc.begin_address, loc.end_address,
      //           result.files[loc.file_index].c_str(), loc.line);
      // for (auto& p : result.subprograms)
      //    fprintf(stderr, "[%08x,%08x) %s\n", p.begin_address, p.end_address, p.name.c_str());
      return result;
   }

   const char* info::get_str(uint32_t offset) const
   {
      eosio::check(offset < strings.size(), "string out of range in .debug_str");
      return &strings[offset];
   }

   const location* info::get_location(uint32_t address) const
   {
      auto it = std::upper_bound(locations.begin(), locations.end(), address,
                                 [](auto a, const auto& b) { return a < b.begin_address; });
      if (it != locations.begin() && address < (--it)->end_address)
         return &*it;
      return nullptr;
   }

   const abbrev_decl* info::get_abbrev_decl(uint32_t table_offset, uint32_t code) const
   {
      auto key = std::pair{table_offset, code};
      auto it = std::lower_bound(abbrev_decls.begin(), abbrev_decls.end(), key,
                                 [](const auto& a, const auto& b) { return a.key() < b; });
      if (it != abbrev_decls.end() && it->key() == key)
         return &*it;
      return nullptr;
   }

   const subprogram* info::get_subprogram(uint32_t address) const
   {
      auto it = std::upper_bound(subprograms.begin(), subprograms.end(), address,
                                 [](auto a, const auto& b) { return a < b.begin_address; });
      if (it != subprograms.begin() && address < (--it)->end_address)
         return &*it;
      return nullptr;
   }

   enum jit_actions : uint32_t
   {
      jit_noaction = 0,
      jit_register_fn,
      jit_unregister_fn
   };

   struct jit_code_entry
   {
      jit_code_entry* next_entry = nullptr;
      jit_code_entry* prev_entry = nullptr;
      const char* symfile_addr = nullptr;
      uint64_t symfile_size = 0;
   };

   struct jit_descriptor
   {
      uint32_t version = 1;
      jit_actions action_flag = jit_noaction;
      jit_code_entry* relevant_entry = nullptr;
      jit_code_entry* first_entry = nullptr;
   };
}  // namespace dwarf

extern "C"
{
   void __attribute__((noinline, optnone)) __jit_debug_register_code(){};
   dwarf::jit_descriptor __jit_debug_descriptor;
}

namespace dwarf
{
   struct debugger_registration
   {
      jit_code_entry desc;
      std::vector<char> symfile;

      ~debugger_registration()
      {
         if (desc.next_entry)
            desc.next_entry->prev_entry = desc.prev_entry;
         if (desc.prev_entry)
            desc.prev_entry->next_entry = desc.next_entry;
         if (__jit_debug_descriptor.first_entry == &desc)
            __jit_debug_descriptor.first_entry = desc.next_entry;
         __jit_debug_descriptor.action_flag = jit_unregister_fn;
         __jit_debug_descriptor.relevant_entry = &desc;
         fflush(stdout);
         fprintf(stderr, "\n\nunregister...\n");
         __jit_debug_register_code();
         fprintf(stderr, "\n\n");
      }

      void reg()
      {
         desc.symfile_addr = symfile.data();
         desc.symfile_size = symfile.size();
         if (__jit_debug_descriptor.first_entry)
         {
            __jit_debug_descriptor.first_entry->prev_entry = &desc;
            desc.next_entry = __jit_debug_descriptor.first_entry;
         }
         __jit_debug_descriptor.action_flag = jit_register_fn;
         __jit_debug_descriptor.first_entry = &desc;
         __jit_debug_descriptor.relevant_entry = &desc;
         fflush(stdout);
         fprintf(stderr, "\n\nregister...\n");
         __jit_debug_register_code();
         fprintf(stderr, "\n\n");
      }

      template <typename T>
      void write(const T& x)
      {
         symfile.insert(symfile.end(), (const char*)(&x), (const char*)(&x + 1));
      }
   };

   std::shared_ptr<debugger_registration> register_with_debugger(  //
       info& info,
       std::vector<jit_addr>&& addresses)
   {
      auto result = std::make_shared<debugger_registration>();
      std::sort(addresses.begin(), addresses.end());
      // for (auto& x : addresses)
      //    fprintf(stdout, "%p %08x\n", x.addr, x.wasm_addr);

      Elf64_Ehdr header{
          .e_ident = {ELFMAG0, ELFMAG1, ELFMAG2, ELFMAG3, ELFCLASS64, ELFDATA2LSB, EV_CURRENT,
                      ELFOSABI_LINUX, 0},
          .e_type = ET_EXEC,
          .e_machine = EM_X86_64,
          .e_version = EV_CURRENT,
          .e_entry = 0,
          .e_phoff = 0,
          .e_shoff = 0,
          .e_flags = 0,
          .e_ehsize = sizeof(header),
          .e_phentsize = 0,
          .e_phnum = 0,
          .e_shentsize = 0,
          .e_shnum = 0,
          .e_shstrndx = 0,
      };
      result->write(header);

      result->reg();
      return result;
   }

}  // namespace dwarf
