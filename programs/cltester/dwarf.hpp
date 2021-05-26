#include <eosio/stream.hpp>
#include <memory>

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

   struct subprogram
   {
      uint32_t begin_address;
      uint32_t end_address;
      std::string name;

      friend bool operator<(const subprogram& a, const subprogram& b)
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

   struct jit_addr
   {
      uint32_t wasm_addr;
      void* addr;

      friend bool operator<(const jit_addr& a, const jit_addr& b)
      {
         return a.wasm_addr < b.wasm_addr;
      }
   };

   struct info
   {
      uint32_t code_offset = 0;
      std::vector<char> strings;
      std::vector<std::string> files;
      std::vector<location> locations;        // sorted
      std::vector<abbrev_decl> abbrev_decls;  // sorted
      std::vector<subprogram> subprograms;    // sorted

      const char* get_str(uint32_t offset) const;
      const location* get_location(uint32_t address) const;
      const abbrev_decl* get_abbrev_decl(uint32_t table_offset, uint32_t code) const;
      const subprogram* get_subprogram(uint32_t address) const;
   };

   info get_info_from_wasm(eosio::input_stream stream);

   struct debugger_registration;
   std::shared_ptr<debugger_registration> register_with_debugger(  //
       info& info,
       std::vector<jit_addr>&& addresses,
       const void* code_start,
       size_t code_size);
}  // namespace dwarf
