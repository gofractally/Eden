#include <accounts.hpp>
#include <distributions.hpp>
#include <elections.hpp>
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
      uint16_t total = 0;
      for (auto iter = ranks.end() - 1, end = ranks.begin(); iter != end; --iter)
      {
         total += *iter;
         if (total > 0)
         {
            auto this_rank = per_rank / total;
            amount -= this_rank * total;
            result.rank_distribution.push_back(this_rank);
         }
         else
         {
            //result.rank_distribution.push_back(per_rank);
         }
      }
      std::reverse(result.rank_distribution.begin(), result.rank_distribution.end());
      if (ranks.back() != 0)
      {
         result.rank_distribution.back() += amount;
         amount -= amount;
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
            distribution_tb.modify(iter, contract, [&](auto& row) {
               row.value = make_distribution(contract, dist->distribution_time, amount);
            });
            eosio::check(
                amount.amount == 0,
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
      distribution_point_table_type distribution_point_tb{contract, default_scope};
      auto iter = distribution_tb.end();
      if (iter == distribution_tb.begin())
      {
         if (init != eosio::block_timestamp())
         {
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
         class accounts dist_account
         {
            contract, make_account_scope(distribution_time, 0)
         };
         distribution_point_tb.emplace(contract, [&](auto& row) {
            row.value = distribution_point_v0{.distribution_time = distribution_time, .rank = 0};
         });
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
               dist_account.add_balance(contract, amount);
            }
         }
         auto total = dist_account.get_account(contract);
         if (total)
         {
            auto amount = total->balance();
            distribution_tb.modify(iter, contract, [&](auto& row) {
               if (next_election_time && *next_election_time > distribution_time)
               {
                  row.value = make_distribution(contract, distribution_time, amount);
               }
               else
               {
                  row.value = election_distribution{distribution_time, amount};
                  amount -= amount;
               }
            });
            if (amount.amount)
            {
               dist_account.sub_balance(contract, amount);
               accounts.add_balance("master"_n, amount);
            }
         }
         else
         {
            distribution_tb.erase(iter);
         }
         iter = distribution_tb.emplace(
             contract, [&](auto& row) { row.value = next_distribution{next_time}; });
         result = true;
      }
   }

   uint32_t distribute_monthly(eosio::name contract, uint32_t max_steps, current_distribution& dist)
   {
      members members{contract};
      std::vector<accounts> accounts_by_rank;
      accounts accounts{contract, make_account_scope(dist.distribution_time, 0)};
      distribution_point_table_type points{contract, default_scope};
      accounts_by_rank.reserve(dist.rank_distribution.size());
      auto& table = members.get_table();
      auto iter = table.upper_bound(dist.last_processed.value);
      auto end = table.end();
      for (; max_steps > 0 && iter != end; ++iter, --max_steps)
      {
         auto member = *iter;
         eosio::check(iter->election_rank() <= dist.rank_distribution.size(),
                      "Invariant failure: rank too high");
         while (accounts_by_rank.size() < iter->election_rank())
         {
            distribution_point_v0 point{dist.distribution_time,
                                        static_cast<uint8_t>(accounts_by_rank.size() + 1)};
            accounts_by_rank.emplace_back(contract,
                                          make_account_scope(dist.distribution_time, point.rank));
            if (points.find(point.primary_key()) == points.end())
            {
               points.emplace(contract, [&](auto& row) { row.value = point; });
            }
         }
         for (uint8_t rank = 0; rank < iter->election_rank(); ++rank)
         {
            auto amount = dist.rank_distribution[rank];
            accounts_by_rank[rank].add_balance(iter->account(), amount);
            accounts.sub_balance(contract, amount);
         }
         dist.last_processed = iter->account();
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

   // Differences from on_resign
   // - iterated (a user cannot block an election by building up too many accounts)
   // - No pending distributions are possible at this stage of the election
   uint32_t distributions::on_election_kick(eosio::name member, uint64_t& key, uint32_t max_steps)
   {
      distribution_point_table_type distribution_point_tb{contract, default_scope};
      accounts owned_accounts{contract, "owned"_n};
      for (auto iter = distribution_point_tb.upper_bound(key), end = distribution_point_tb.end();
           max_steps > 0 && iter != end; ++iter, --max_steps)
      {
         accounts accounts(contract, eosio::name(iter->primary_key()));
         key = iter->primary_key();
         if (auto account = accounts.get_account(member))
         {
            accounts.sub_balance(member, account->balance());
            owned_accounts.add_balance("master"_n, account->balance());
         }
      }
      return max_steps;
   }

   void distributions::on_resign(const member& member)
   {
      distribution_point_table_type distribution_point_tb{contract, default_scope};
      accounts owned_accounts{contract, "owned"_n};
      setup_distribution(contract, owned_accounts);
      for (auto iter = distribution_point_tb.begin(), end = distribution_point_tb.end();
           iter != end; ++iter)
      {
         accounts accounts(contract, eosio::name(iter->primary_key()));
         if (auto account = accounts.get_account(member.account()))
         {
            accounts.sub_balance(member.account(), account->balance());
            owned_accounts.add_balance("master"_n, account->balance());
         }
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
               accounts accounts(contract, make_account_scope(dist->distribution_time, 0));
               accounts.sub_balance(contract, amount);
               owned_accounts.add_balance("master"_n, amount);
            }
         }
         else
         {
            break;
         }
      }
   }

   uint32_t distributions::gc(uint32_t max_steps)
   {
      distribution_point_table_type distribution_point_tb{contract, default_scope};
      for (auto iter = distribution_point_tb.begin(), end = distribution_point_tb.end();
           max_steps > 0 && iter != end; --max_steps)
      {
         account_table_type account_tb{contract, iter->primary_key()};
         if (account_tb.begin() != account_tb.end())
         {
            break;
         }
         iter = distribution_point_tb.erase(iter);
      }
      return max_steps;
   }

   void distributions::clear_all()
   {
      distribution_point_table_type distribution_point_tb{contract, default_scope};
      for (auto iter = distribution_point_tb.begin(), end = distribution_point_tb.end();
           iter != end;)
      {
         accounts accounts(contract, eosio::name(iter->primary_key()));
         accounts.clear_all();
         iter = distribution_point_tb.erase(iter);
      }
      clear_table(pool_table_type{contract, default_scope});
      clear_table(distribution_table_type{contract, default_scope});
   }
}  // namespace eden
