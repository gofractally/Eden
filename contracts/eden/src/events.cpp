#include <eosio/action.hpp>
#include <events.hpp>

namespace eden
{
   std::vector<event> events;

   void send_events(eosio::name self)
   {
      if (!events.empty())
      {
         eosio::action{{self, "active"_n}, "eosio.null"_n, "eden.events"_n, events}.send();
         events.clear();
      }
   }
}  // namespace eden
