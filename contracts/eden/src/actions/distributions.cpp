#include <accounts.hpp>
#include <distributions.hpp>
#include <eden.hpp>
#include <globals.hpp>

namespace eden
{
   void eden::setdistpct(uint8_t pct)
   {
      require_auth(get_self());
      eosio::check(pct >= 1 && pct <= 15, "Proposed distribution is out of the valid range");

      set_distribution_pct(get_self(), pct);
   }

   void eden::collectfunds(uint32_t max_steps)
   {
      eosio::check(distributions{get_self()}.on_collectfunds(max_steps) != max_steps,
                   "Nothing to do");
   }

   void eden::setcoltime(uint8_t months)
   {
      require_auth(get_self());
      // validate if it is required that no distribution is in progress
      eosio::check(months > 0, "Max months to collect the funds should be at least 1");
      globals{get_self()}.set_max_month_withdraw(months);
   }

}  // namespace eden
