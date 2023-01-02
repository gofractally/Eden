#include <badges.hpp>
#include <elections.hpp>

namespace eden
{
   void badges::create_badge(eosio::name account, uint8_t round)
   {
      auto vote_time = eosio::current_time_point();
      auto badge_idx = badge_tb.get_index<"byround"_n>();
      auto badge_iter = badge_idx.find(round_account_key(round, account));

      if (badge_iter == badge_idx.end())
      {
         badge_tb.emplace(contract,
                          [&](auto& row)
                          {
                             row.value = badge_v0{.id = badge_tb.available_primary_key(),
                                                  .account = account,
                                                  .round = round,
                                                  .vote_time = vote_time};
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
      eosio::print("SENDING_BADGES\n");
      elections elections(contract);

      for (auto it = badge_tb.begin(); it != badge_tb.end() && max_steps > 0;)
      {
         if (elections.is_round_over(it->vote_time()))
         {
            eosio::action{
                {contract, "active"_n},
                sbt_account,
                "givesimple"_n,
                std::tuple(contract, "voterbadge"_n, contract, it->account(),
                           std::string("round " + std::to_string(it->round()) + ", " +
                                       std::to_string(it->vote_time().sec_since_epoch())))}
                .send();

            it = badge_tb.erase(it);
            --max_steps;
         }
      }

      return max_steps;
   }
}  // namespace eden