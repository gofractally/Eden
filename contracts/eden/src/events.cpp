#include <eosio/action.hpp>
#include <eosio/bytes.hpp>
#include <events.hpp>

namespace eden
{
   std::vector<char> serialized_events;
   uint32_t num_events = 0;

   void push_event(const event& e, eosio::name self)
   {
      auto s = eosio::convert_to_bin(e);
      auto est_size = 5 + serialized_events.size() + s.size();
      if (est_size > 4 * 1024)
         send_events(self);
      serialized_events.insert(serialized_events.end(), s.begin(), s.end());
      ++num_events;
   }

   void send_events(eosio::name self)
   {
      if (num_events)
      {
         eosio::action act;
         act.account = "eosio.null"_n;
         act.name = "eden.events"_n;
         act.authorization.push_back({self, "active"_n});
         eosio::convert_to_bin(eosio::varuint32{num_events}, act.data);
         act.data.insert(act.data.end(), serialized_events.begin(), serialized_events.end());
         act.send();
         serialized_events.clear();
         num_events = 0;
      }
   }
}  // namespace eden
