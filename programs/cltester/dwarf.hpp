#include <eosio/stream.hpp>

namespace dwarf
{
   struct info
   {
   };

   info get_info_from_wasm(eosio::input_stream stream);
}  // namespace dwarf
