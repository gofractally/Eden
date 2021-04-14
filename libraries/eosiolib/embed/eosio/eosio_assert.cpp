#include <string.h>
#include <eosio/check.hpp>

namespace eosio
{
   namespace internal_use_do_not_use
   {
      extern "C" void eosio_assert(uint32_t test, const char* msg)
      {
         if (!test)
            eosio_assert_message(test, msg, strlen(msg));
      }

   }  // namespace internal_use_do_not_use
}  // namespace eosio
