#include <string.h>
#include <eosio/chain_conversions.hpp>
#include <eosio/print.hpp>

namespace eosio
{
   namespace internal_use_do_not_use
   {
      extern "C" void printn(uint64_t n) { print(name_to_string(n)); }

   }  // namespace internal_use_do_not_use
}  // namespace eosio
