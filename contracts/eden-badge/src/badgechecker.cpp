#include <badgechecker/badgechecker.hpp>

namespace eden
{
   void contract::notify_givesimple(eosio::name org,
                                    eosio::name badge,
                                    eosio::name authorizer,
                                    eosio::name to,
                                    std::string memo)
   {
      checks_table checks_tb(sbt_account, sbt_account.value);
      auto itr = checks_tb.find(org.value);

      eosio::check(itr != checks_tb.end(), "Org not found");

      if (itr->org == org && eosio::has_auth(org))
      {
         return;
      }

      eosio::check(itr->checks_contract == authorizer,
                   authorizer.to_string() +
                       " is not authorized to issue sbt on behalf of genesis.eden contract");
   }
}  // namespace eden

EOSIO_ACTION_DISPATCHER(eden::actions)
EOSIO_ABIGEN(actions(eden::actions))
