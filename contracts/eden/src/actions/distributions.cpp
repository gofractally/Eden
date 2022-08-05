#include <eden.hpp>
#include <distributions.hpp>

namespace eden
{
   void eden::setdistptc(uint8_t ptc)
   {
      require_auth(get_self());
      eosio::check(ptc >= 1 && ptc <= 15, "Proposed distribution is out of the valid range");

      set_distribution_pct(get_self(), ptc);
   }

}  // namespace eden
