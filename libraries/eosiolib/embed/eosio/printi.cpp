#include <string.h>
#include <eosio/print.hpp>

namespace eosio
{
   namespace internal_use_do_not_use
   {
      extern "C" void printi(int64_t value)
      {
         if (value < 0)
         {
            prints("-");
            printui(-value);
         }
         else
            printui(value);
      }

   }  // namespace internal_use_do_not_use
}  // namespace eosio
