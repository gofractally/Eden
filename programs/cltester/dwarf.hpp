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

   struct info
   {
      uint32_t code_offset = 0;
      std::vector<std::string> files;
      std::vector<location> locations;  // sorted by address
   };

   info get_info_from_wasm(eosio::input_stream stream);
}  // namespace dwarf
