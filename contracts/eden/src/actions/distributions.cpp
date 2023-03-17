#include <accounts.hpp>
#include <distributions.hpp>
#include <eden.hpp>
#include <migrations.hpp>

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
      // eosio::check(migrations{get_self()}.is_completed<migrate_global_v0>(),
      //              "Global must be migrated to enable collecting funds");
      eosio::check(distributions{get_self()}.on_collectfunds(max_steps) != max_steps,
                   "Nothing to do");
   }

}  // namespace eden
