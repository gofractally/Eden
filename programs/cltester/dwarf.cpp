#include "dwarf.hpp"

#include <eosio/from_bin.hpp>
#include <eosio/vm/constants.hpp>
#include <eosio/vm/sections.hpp>

#include <stdio.h>

namespace dwarf
{
   inline constexpr uint8_t lns_version = 4;

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

   std::string get_string(eosio::input_stream& s)
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
      return {begin, s.pos - 1};
   }

   void get_strings(std::vector<std::string>& v, eosio::input_stream& s)
   {
      while (true)
      {
         auto str = get_string(s);
         if (str.empty())
            break;
         v.push_back(std::move(str));
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
         auto str = get_string(s);
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
      while (stream.remaining())
      {
         auto section_begin = stream.pos;
         auto section = eosio::from_bin<wasm_section>(stream);
         if (section.id == eosio::vm::section_id::code_section)
         {
            result.code_offset = section_begin - file_begin;
         }
         else if (section.id == eosio::vm::section_id::custom_section)
         {
            auto name = eosio::from_bin<std::string>(section.data);
            if (name == ".debug_line")
               dwarf::parse_debug_line(result, files, section.data);
            else if (name == ".debug_abbrev")
               dwarf::parse_debug_abbrev(result, files, section.data);
         }
      }

      std::sort(result.locations.begin(), result.locations.end());
      std::sort(result.abbrev_decls.begin(), result.abbrev_decls.end());
      // for (auto& loc : result.locations)
      //    fprintf(stderr, "[%08x,%08x) %s:%d\n", loc.begin_address, loc.end_address,
      //           result.files[loc.file_index].c_str(), loc.line);
      return result;
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
}  // namespace dwarf
