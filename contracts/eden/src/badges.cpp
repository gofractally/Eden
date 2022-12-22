#include <badges.hpp>

namespace eden
{
   void badges::create_badge(eosio::name account,
                             uint8_t round,
                             eosio::time_point vote_time,
                             std::string& description)
   {
      badge_tb.emplace(contract,
                       [&](auto& row)
                       {
                          row.value = badge_v0{
                              .id = badge_tb.available_primary_key(),
                              .account = account,
                              .round = round,
                              .vote_time = vote_time,
                              .description = description,
                          };
                       });
   }

   uint32_t badges::send_badges(uint32_t max_steps)
   {
      for (auto itr = badge_tb.begin(); itr != badge_tb.end() && max_steps > 0; --max_steps)
      {
         eosio::action{{contract, "active"_n},
                       sbt_account,
                       "givesimple"_n,
                       std::tuple(contract, "voterbadge"_n, contract, itr->account(),
                                  std::string("election_date:" +
                                              std::to_string(itr->vote_time().sec_since_epoch()) +
                                              ",round:" + std::to_string(itr->round()) +
                                              ",description:" + itr->description()))}
             .send();

         itr = badge_tb.erase(itr);
      }

      return max_steps;
   }
}  // namespace eden