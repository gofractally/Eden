#include <accounts.hpp>
#include <distributions.hpp>
#include <elections.hpp>
#include <events.hpp>
#include <members.hpp>
#include <numeric>

namespace eden
{
   void init_pools(eosio::name contract)
   {
      pool_table_type pool_tb{contract, default_scope};
      pool_tb.emplace(contract, [](auto& row) { row.value = pool_v0{"master"_n, 5}; });
   }

   static current_distribution make_distribution(eosio::name contract,
                                                 eosio::block_timestamp start_time,
                                                 eosio::asset& amount)
   {
      members members{contract};
      current_distribution result{start_time, eosio::name()};
      auto ranks = members.stats().ranks;
      auto per_rank = amount / (ranks.size() - 1);
      eosio::asset used{0, amount.symbol};
      uint16_t total = 0;
      for (auto iter = ranks.end() - 1, end = ranks.begin(); iter != end; --iter)
      {
         total += *iter;
         if (total > 0)
         {
            auto this_rank = per_rank / total;
            used += this_rank * total;
            result.rank_distribution.push_back(this_rank);
         }
      }
      std::reverse(result.rank_distribution.begin(), result.rank_distribution.end());
      if (ranks.back() != 0)
      {
         result.rank_distribution.back() += (amount - used);
      }
      else
      {
         amount = used;
      }
      return result;
   }

   void process_election_distribution(eosio::name contract)
   {
      distribution_table_type distribution_tb{contract, default_scope};
      for (auto iter = distribution_tb.begin(), end = distribution_tb.end(); iter != end; ++iter)
      {
         if (auto* dist = std::get_if<election_distribution>(&iter->value))
         {
            auto amount = dist->amount;
            auto old = amount;
            distribution_tb.modify(iter, contract, [&](auto& row) {
               auto d = make_distribution(contract, dist->distribution_time, amount);
               push_event(
                   distribution_event_begin{
                       .distribution_time = d.distribution_time,
                       .rank_distribution = d.rank_distribution,
                   },
                   contract);
               row.value = std::move(d);
            });
            eosio::check(
                amount == old,
                "Invariant failure: post-election distribution should not be missing a satoshi");
         }
         else if (std::holds_alternative<next_distribution>(iter->value))
         {
            break;
         }
      }
   }

   bool setup_distribution(eosio::name contract, eosio::block_timestamp init)
   {
      accounts accounts{contract, "owned"_n};
      return setup_distribution(contract, accounts, init);
   }

   bool setup_distribution(eosio::name contract, accounts& accounts, eosio::block_timestamp init)
   {
      distribution_table_type distribution_tb{contract, default_scope};
      auto iter = distribution_tb.end();
      if (iter == distribution_tb.begin())
      {
         if (init != eosio::block_timestamp())
         {
            push_event(distribution_event_schedule{init}, contract);
            distribution_tb.emplace(contract,
                                    [&](auto& row) { row.value = next_distribution{init}; });
         }
         else
         {
            return false;
         }
      }
      --iter;
      bool result = false;
      auto next_election_time = init != eosio::block_timestamp()
                                    ? std::optional{init}
                                    : elections{contract}.get_next_election_time();
      distribution_account_table_type dist_accounts{contract, default_scope};
      while (true)
      {
         eosio::block_timestamp distribution_time;
         if (auto* next = std::get_if<next_distribution>(&iter->value))
         {
            if (next->distribution_time <= eosio::current_block_time())
            {
               distribution_time = next->distribution_time;
            }
            else
            {
               return result;
            }
         }
         else
         {
            eosio::check(false, "Invariant failure: no next distribution");
         }
         eosio::block_timestamp next_time{distribution_time.to_time_point() + eosio::days(30)};
         std::optional<uint128_t> prorate_num;
         constexpr uint32_t prorate_den = 30 * 24 * 60 * 60 * 100;
         if (next_election_time)
         {
            if (*next_election_time<next_time&& * next_election_time> distribution_time)
            {
               next_time = *next_election_time;
               prorate_num = (next_time.slot - distribution_time.slot) / 2;
            }
         }
         pool_table_type pool_tb{contract, default_scope};
         if (pool_tb.begin() == pool_tb.end())
         {
            pool_tb.emplace(contract, [](auto& row) { row.value = pool_v0{"master"_n, 5}; });
         }
         eosio::asset total = {};
         for (const auto& pool : pool_tb)
         {
            auto account = accounts.get_account(pool.name());
            if (account)
            {
               auto amount = prorate_num
                                 ? eosio::asset(*prorate_num * pool.monthly_distribution_pct() *
                                                    account->balance().amount / prorate_den,
                                                account->balance().symbol)
                                 : (pool.monthly_distribution_pct() * account->balance() / 100);
               accounts.sub_balance(pool.name(), amount);
               if (!total.amount)
               {
                  total = amount;
               }
               else
               {
                  total += amount;
               }
            }
         }
         if (total.amount)
         {
            auto used = total;
            distribution_tb.modify(iter, contract, [&](auto& row) {
               if (next_election_time && *next_election_time > distribution_time)
               {
                  push_event(distribution_event_reserve{distribution_time, total}, contract);
                  auto d = make_distribution(contract, distribution_time, used);
                  push_event(
                      distribution_event_begin{
                          .distribution_time = d.distribution_time,
                          .rank_distribution = d.rank_distribution,
                      },
                      contract);
                  row.value = std::move(d);
               }
               else
               {
                  push_event(distribution_event_reserve{distribution_time, total}, contract);
                  row.value = election_distribution{distribution_time, total};
               }
            });
            if (used != total)
            {
               accounts.add_balance("master"_n, total - used);
            }
            dist_accounts.emplace(contract, [&](auto& row) {
               row.value = distribution_account_v0{.id = dist_accounts.available_primary_key(),
                                                   .owner = contract,
                                                   .distribution_time = distribution_time,
                                                   .rank = 0,
                                                   .balance = used};
            });
         }
         else
         {
            push_event(distribution_event_reserve{distribution_time, total}, contract);
            push_event(
                distribution_event_begin{
                    .distribution_time = distribution_time,
                    .rank_distribution = {},
                },
                contract);
            push_event(distribution_event_end{distribution_time}, contract);
            distribution_tb.erase(iter);
         }
         push_event(distribution_event_schedule{next_time}, contract);
         iter = distribution_tb.emplace(
             contract, [&](auto& row) { row.value = next_distribution{next_time}; });
         result = true;
      }
   }

   uint32_t distribute_monthly(eosio::name contract, uint32_t max_steps, current_distribution& dist)
   {
      members members{contract};
      distribution_account_table_type dist_accounts_tb{contract, default_scope};
      auto dist_idx = dist_accounts_tb.get_index<"byowner"_n>();
      auto dist_iter = dist_idx.find(distribution_account_key(contract, dist.distribution_time, 0));
      auto& table = members.get_table();
      auto iter = table.upper_bound(dist.last_processed.value);
      auto end = table.end();
      for (; max_steps > 0 && iter != end; ++iter, --max_steps)
      {
         eosio::check(iter->election_rank() <= dist.rank_distribution.size(),
                      "Invariant failure: rank too high");
         for (uint8_t rank = 0; rank < iter->election_rank(); ++rank)
         {
            auto amount = dist.rank_distribution[rank];
            dist_accounts_tb.emplace(contract, [&](auto& row) {
               auto fund = distribution_account_v0{.id = dist_accounts_tb.available_primary_key(),
                                                   .owner = iter->account(),
                                                   .distribution_time = dist.distribution_time,
                                                   .rank = static_cast<uint8_t>(rank + 1),
                                                   .balance = amount};
               push_event(
                   distribution_event_fund{
                       .owner = fund.owner,
                       .distribution_time = fund.distribution_time,
                       .rank = fund.rank,
                       .balance = fund.balance,
                   },
                   contract);
               row.value = fund;
            });
            if (dist_iter != dist_idx.end())
            {
               dist_accounts_tb.modify(*dist_iter, contract,
                                       [&](auto& row) { row.balance() -= amount; });
            }
            else
            {
               eosio::check(amount.amount == 0, "Overdrawn balance");
            }
         }
         dist.last_processed = iter->account();
      }
      if (dist_iter != dist_idx.end())
      {
         eosio::check(dist_iter->balance().amount >= 0, "Overdrawn balance");
         if (dist_iter->balance().amount == 0)
         {
            dist_accounts_tb.erase(*dist_iter);
         }
      }
      return max_steps;
   }

   uint32_t distribute_monthly(eosio::name contract, uint32_t max_steps)
   {
      if (max_steps > 0)
      {
         if (setup_distribution(contract))
         {
            --max_steps;
         }
      }
      distribution_table_type distribution_tb{contract, default_scope};
      for (auto iter = distribution_tb.begin(), end = distribution_tb.end();
           max_steps && iter != end;)
      {
         if (auto* current = std::get_if<current_distribution>(&iter->value))
         {
            auto copy = *current;
            max_steps = distribute_monthly(contract, max_steps, copy);
            if (max_steps)
            {
               push_event(distribution_event_end{current->distribution_time}, contract);
               iter = distribution_tb.erase(iter);
               --max_steps;
            }
            else
            {
               distribution_tb.modify(iter, contract, [&](auto& row) { row.value = copy; });
               return max_steps;
            }
         }
         else if (std::holds_alternative<next_distribution>(iter->value))
         {
            return max_steps;
         }
         else if (auto* election = std::get_if<election_distribution>(&iter->value))
         {
            // We're still in the election.  election_distribution should
            // be converted to current_distribution when the election is
            // finished.
            return max_steps;
         }
         else
         {
            eosio::check(false, "Invariant failure: unexpected distribution type");
         }
      }
      return max_steps;
   }

   void distributions::sub_balance(eosio::name from,
                                   eosio::block_timestamp distribution_time,
                                   uint8_t rank,
                                   eosio::asset amount)
   {
      const auto& row = distribution_account_tb.get_index<"byowner"_n>().get(
          distribution_account_key(from, distribution_time, rank));
      eosio::check(row.balance() >= amount, "insufficient balance");
      if (row.balance() == amount)
      {
         distribution_account_tb.erase(row);
      }
      else
      {
         distribution_account_tb.modify(row, contract, [&](auto& row) { row.balance() -= amount; });
      }
   }

   // Differences from on_resign
   // - iterated (a user cannot block an election by building up too many accounts)
   // - No pending distributions are possible at this stage of the election
   uint32_t distributions::on_election_kick(eosio::name member, uint32_t max_steps)
   {
      accounts owned_accounts{contract, "owned"_n};
      auto member_idx = distribution_account_tb.get_index<"byowner"_n>();
      for (auto iter = member_idx.lower_bound(uint128_t(member.value) << 64),
                end = member_idx.end();
           max_steps > 0 && iter != end && iter->owner() == member; --max_steps)
      {
         owned_accounts.add_balance("master"_n, iter->balance());
         iter = member_idx.erase(iter);
      }
      return max_steps;
   }

   void distributions::on_resign(const member& member)
   {
      accounts owned_accounts{contract, "owned"_n};
      setup_distribution(contract, owned_accounts);
      auto member_idx = distribution_account_tb.get_index<"byowner"_n>();
      for (auto iter = member_idx.lower_bound(uint128_t(member.account().value) << 64),
                end = member_idx.end();
           iter != end && iter->owner() == member.account();)
      {
         owned_accounts.add_balance("master"_n, iter->balance());
         iter = member_idx.erase(iter);
      }
      // handle distributions that are in progress
      distribution_table_type distribution_tb{contract, default_scope};
      for (auto iter = distribution_tb.begin(), end = distribution_tb.end(); iter != end; ++iter)
      {
         if (auto* dist = std::get_if<current_distribution>(&iter->value))
         {
            if (dist->last_processed < member.account() && member.election_rank() > 0)
            {
               eosio::check(member.election_rank() <= dist->rank_distribution.size(),
                            "Invariant failure: rank too high");
               auto amount =
                   std::accumulate(dist->rank_distribution.begin() + 1,
                                   dist->rank_distribution.begin() + member.election_rank(),
                                   dist->rank_distribution.front());
               auto account_iter =
                   member_idx.find(distribution_account_key(contract, dist->distribution_time, 0));
               if (account_iter != member_idx.end())
               {
                  eosio::check(amount <= account_iter->balance(), "insufficient balance");
                  if (account_iter->balance() == amount)
                  {
                     member_idx.erase(account_iter);
                  }
                  else
                  {
                     member_idx.modify(account_iter, contract,
                                       [&](auto& row) { row.balance() -= amount; });
                  }
               }
               else
               {
                  eosio::check(amount.amount == 0, "insufficient balance");
               }
               owned_accounts.add_balance("master"_n, amount);
            }
         }
         else
         {
            break;
         }
      }
   }

   void distributions::clear_all()
   {
      clear_table(distribution_account_tb);
      clear_table(pool_table_type{contract, default_scope});
      clear_table(distribution_table_type{contract, default_scope});
   }
}  // namespace eden
