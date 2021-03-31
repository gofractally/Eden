#include <string.h>
#include <eosio/print.hpp>

namespace eosio
{
   namespace internal_use_do_not_use
   {
      extern "C" void prints(const char* cstr) { prints_l(cstr, strlen(cstr)); }

   }  // namespace internal_use_do_not_use
}  // namespace eosio
