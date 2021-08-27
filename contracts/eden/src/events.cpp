#include <eosio/action.hpp>
#include <events.hpp>

namespace eden
{
   std::vector<event> events;

   void push_event(const event& e, eosio::name self)
   {
      events.push_back(e);
      if (events.size() >= 10)
         send_events(self);
   }

   void send_events(eosio::name self)
   {
      if (!events.empty())
      {
         eosio::action{{self, "active"_n}, "eosio.null"_n, "eden.events"_n, events}.send();
         events.clear();
      }
   }
}  // namespace eden
