#include <string.h>
#include "polyfill_helpers.hpp"

extern "C"
{
   [[clang::import_name("eosio_assert_message"), noreturn]] void
   eosio_assert_message(uint32_t, const char* msg, uint32_t len)
   {
      polyfill::abort_message(msg, len);
   }

   [[clang::import_name("eosio_assert"), noreturn]] void eosio_assert(uint32_t, const char* msg)
   {
      polyfill::abort_message(msg, strlen(msg));
   }
}
