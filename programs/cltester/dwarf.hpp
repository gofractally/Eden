#include <eosio/stream.hpp>

namespace dwarf
{
   struct location
   {
      uint32_t address = 0;
      uint32_t file_index = 0;
      uint32_t line = 0;

      friend bool operator<(const location& a, const location& b) { return a.address < b.address; }
   };

   struct info
   {
      std::vector<std::string> files;
      std::vector<location> locations;  // sorted by address
   };

   info get_info_from_wasm(eosio::input_stream stream);
}  // namespace dwarf
