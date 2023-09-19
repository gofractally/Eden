#include <badges.hpp>
#include <elections.hpp>

namespace eden
{
   void badges::create_badge(eosio::name account)
   {
      const auto& state = elections(contract).check_active();
      auto vote_time = eosio::current_time_point();
      auto badge_idx = badge_tb.get_index<"byround"_n>();
      auto badge_iter =
          badge_idx.find(round_account_key(account, state.round_end.to_time_point(), state.round));

      if (badge_iter == badge_idx.end())
      {
         badge_tb.emplace(contract,
                          [&](auto& row)
                          {
                             row.value = badge_v0{
                                 .id = badge_tb.available_primary_key(),
                                 .account = account,
                                 .round = state.round,
                                 .vote_time = vote_time,
                                 .end_vote_time = state.round_end.to_time_point(),
                             };
                          });
      }
      else
      {
         badge_idx.modify(badge_iter, eosio::same_payer,
                          [&](auto& row) { row.vote_time() = vote_time; });
      }
   }

   uint32_t badges::send_badges(uint32_t max_steps)
   {
      auto max_round_duration_sec = globals.get().election_round_time_sec;
      auto badge_idx = badge_tb.get_index<"byvotetime"_n>();
      auto round_time_point = elections(contract).get_round_time_point();
      uint64_t max_round_time = round_time_point > eosio::time_point()
                                    ? round_time_point.sec_since_epoch() - max_round_duration_sec
                                    : eosio::current_time_point().sec_since_epoch();

      for (auto it = badge_idx.lower_bound(eosio::time_point().sec_since_epoch()),
                end_it = badge_idx.lower_bound(max_round_time);
           it != end_it && max_steps > 0; --max_steps)
      {
         eosio::action{{contract, "active"_n},
                       sbt_account,
                       "givesimple"_n,
                       std::tuple(contract, "epvi"_n, contract, it->account(),
                                  std::string("round " + std::to_string(it->round()) + ", " +
                                              std::to_string(it->vote_time().sec_since_epoch())))}
             .send();

         it = badge_idx.erase(it);
      }

      return max_steps;
   }
}  // namespace eden