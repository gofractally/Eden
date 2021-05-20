#include <eosio/stream.hpp>

namespace dwarf
{
   struct location
   {
      uint32_t begin_address = 0;
      uint32_t end_address = 0;
      uint32_t file_index = 0;
      uint32_t line = 0;

      friend bool operator<(const location& a, const location& b)
      {
         return a.begin_address < b.begin_address;
      }
   };

   struct abbrev_attr
   {
      uint32_t name = 0;
      uint32_t form = 0;
   };

   struct abbrev_decl
   {
      uint32_t table_offset = 0;
      uint32_t code = 0;
      uint32_t tag = 0;
      bool has_children = false;
      std::vector<abbrev_attr> attrs;

      auto key() const { return std::pair{table_offset, code}; }
      friend bool operator<(const abbrev_decl& a, const abbrev_decl& b)
      {
         return a.key() < b.key();
      }
   };

   struct info
   {
      uint32_t code_offset = 0;
      std::vector<char> strings;
      std::vector<std::string> files;
      std::vector<location> locations;        // sorted
      std::vector<abbrev_decl> abbrev_decls;  // sorted

      const char* get_str(uint32_t offset) const;
      const location* get_location(uint32_t address) const;
      const abbrev_decl* get_abbrev_decl(uint32_t table_offset, uint32_t code) const;
   };

   info get_info_from_wasm(eosio::input_stream stream);
}  // namespace dwarf
