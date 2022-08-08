#include <eden.hpp>
#include <distributions.hpp>

namespace eden
{
   void eden::setdistpct(uint8_t pct)
   {
      require_auth(get_self());
      eosio::check(pct >= 1 && pct <= 15, "Proposed distribution is out of the valid range");

      set_distribution_pct(get_self(), pct);
   }

}  // namespace eden
