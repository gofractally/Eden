#include <bylaws.hpp>
#include <elections.hpp>
#include <eosio/crypto.hpp>
#include <eosio/system.hpp>
#include <members.hpp>

namespace eden
{
   election_rng::election_rng(const eosio::checksum256& seed)
   {
      auto a = seed.extract_as_byte_array();
      memcpy(inbuf, a.data(), a.size());
      memset(inbuf + 32, 0, 8);
      index = 32;
   }

   election_rng::result_type election_rng::operator()()
   {
      if (index >= 32)
      {
         auto a = eosio::sha256(inbuf, sizeof(inbuf)).extract_as_byte_array();
         memcpy(outbuf, a.data(), a.size());
         uint64_t counter;
         memcpy(&counter, inbuf + 32, sizeof(counter));
         ++counter;
         memcpy(inbuf + 32, &counter, sizeof(counter));
         index = 0;
      }
      result_type result;
      memcpy(&result, outbuf + index, sizeof(result_type));
      index += sizeof(result_type);
      return result;
   }

   static uint32_t int_pow(uint32_t base, uint32_t exponent)
   {
      uint32_t result = 1;
      for (uint32_t i = 0; i < exponent; ++i)
      {
         result *= base;
      }
      return result;
   }

   uint32_t int_root(uint32_t x, uint32_t y)
   {
      // find z, such that $z^y \le x < (z+1)^y$
      //
      // hard coded limits based on the election constraints
      uint32_t low = 0, high = 12;
      while (high - low > 1)
      {
         uint32_t mid = (high + low) / 2;
         if (x < int_pow(mid, y))
         {
            high = mid;
         }
         else
         {
            low = mid;
         }
      }
      return low;
   }

   std::size_t count_rounds(uint32_t num_members)
   {
      std::size_t result = 1;
      for (uint32_t i = 12; i <= num_members; i *= 4)
      {
         ++result;
      }
      return result;
   }

   auto get_group_sizes(uint32_t num_members, std::size_t num_rounds)
   {
      auto basic_group_size = int_root(num_members, num_rounds);
      if (basic_group_size == 3)
      {
         std::vector<uint32_t> result(num_rounds, 4);
         // result.front() is always 4, but for some reason, that causes clang to miscompile this.
         // TODO: look for UB...
         auto large_rounds =
             static_cast<std::size_t>(std::log(static_cast<double>(num_members) /
                                               int_pow(result.front(), num_rounds - 1) / 3) /
                                      std::log(1.25));
         result.back() = 3;
         eosio::check(large_rounds <= 1,
                      "More that one large round is unexpected when the final group size is 3.");
         for (int i = result.size() - large_rounds - 1; i < result.size() - 1; ++i)
         {
            result[i] = 5;
         }
         return result;
      }
      else if (basic_group_size >= 6)
      {
         // 5,6,...,6,N
         std::vector<uint32_t> result(num_rounds, 6);
         result.front() = 5;
         auto divisor = int_pow(6, num_rounds - 1);
         result.back() = (num_members + divisor - 1) / divisor;
         return result;
      }
      else
      {
         // \lfloor \log_{(G+1)/G}\frac{N}{G^R} \rfloor
         auto large_rounds = static_cast<std::size_t>(
             std::log(static_cast<double>(num_members) / int_pow(basic_group_size, num_rounds)) /
             std::log((basic_group_size + 1.0) / basic_group_size));
         // x,x,x,x,x,x
         std::vector<uint32_t> result(num_rounds, basic_group_size + 1);
         std::fill_n(result.begin(), num_rounds - large_rounds, basic_group_size);
         return result;
      }
   }

   election_config make_election_config(uint16_t num_participants)
   {
      if (num_participants == 0)
         return {};
      auto sizes = get_group_sizes(num_participants, count_rounds(num_participants));
      election_config result(sizes.size());
      uint16_t next_participants = 1;
      for (uint32_t i = 0; i < sizes.size() - 1; ++i)
      {
         auto idx = result.size() - i - 1;
         uint16_t participants = next_participants * sizes[idx];
         result[idx] = {participants, next_participants};
         next_participants = participants;
      }
      result[0] = {num_participants, next_participants};
      return result;
   }

   // Incremental implementation of shuffle
   // After adding all voters, each voter will have unique integer in [0, N) as
   // a group_id.
   void elections::add_voter(current_election_state_init_voters& state, eosio::name member)
   {
      std::uniform_int_distribution<uint16_t> dist(0, state.next_member_idx);
      auto pos = dist(state.rng);
      if (pos != state.next_member_idx)
      {
         auto group_idx = vote_tb.get_index<"bygroup"_n>();
         const auto& old = group_idx.get(pos);
         group_idx.modify(old, eosio::same_payer,
                          [&](auto& row) { row.group_id = state.next_member_idx; });
      }
      vote_tb.emplace(contract, [&](auto& row) {
         row.member = member;
         row.group_id = pos;
      });
      ++state.next_member_idx;
   }

   static uint64_t get_group_id(uint64_t level, uint64_t offset)
   {
      return (level << 16) + offset + 1;
   }

   void elections::assign_voter_to_group(current_election_state_group_voters& state,
                                         const struct vote& v)
   {
      vote_tb.modify(v, eosio::same_payer, [&](auto& row) {
         row.group_id = get_group_id(0, row.group_id % state.config[0].num_groups);
      });
   }

   void elections::build_group(current_election_state_build_groups& state,
                               uint8_t level,
                               uint16_t offset)
   {
      group_tb.emplace(contract, [&](auto& row) {
         row.group_id = get_group_id(level, offset);
         if (level + 1 < state.config.size())
         {
            row.next_group = get_group_id(level + 1, offset % state.config[level + 1].num_groups);
         }
         else
         {
            row.next_group = 0;
         }
         row.group_size = state.config[level].group_max_size();
         if (offset > state.config[level].num_groups - state.config[level].num_short_groups())
         {
            --row.group_size;
         }
      });
   }

   void elections::start_election(const eosio::checksum256& seed)
   {
      eosio::check(!state_sing.exists(), "An election is already in progress");
      state_sing.set(current_election_state_init_voters{0, election_rng{seed}}, contract);

      election_state_singleton state(contract, default_scope);
      auto state_value = std::get<election_state_v0>(state.get_or_default());
      ++state_value.election_sequence;
      state_value.last_election_time = eosio::current_block_time();
      state.set(state_value, contract);

      bylaws bylaws(contract);
      bylaws.new_board();
   }

   uint32_t elections::randomize_voters(current_election_state_init_voters& state,
                                        uint32_t max_steps)
   {
      election_state_singleton sequence_state(contract, default_scope);
      auto expected_sequence =
          std::get<election_state_v0>(sequence_state.get()).election_sequence - 1;
      members members(contract);
      const auto& member_tb = members.get_table();
      auto iter = member_tb.upper_bound(state.last_processed.value);
      auto end = member_tb.end();
      for (; max_steps > 0 && iter != end; --max_steps)
      {
         if (iter->status() == member_status::active_member)
         {
            if (iter->election_sequence() < expected_sequence)
            {
               iter = members.erase(iter);
               continue;
            }
            else if (iter->election_sequence() == expected_sequence)
            {
               add_voter(state, iter->account());
            }
         }
         state.last_processed = iter->account();
         ++iter;
      }
      return max_steps;
   }

   uint32_t elections::group_voters(current_election_state_group_voters& state, uint32_t max_steps)
   {
      auto iter = vote_tb.upper_bound(state.last_processed.value);
      auto end = vote_tb.end();
      for (; iter != end && max_steps > 0; --max_steps, ++iter)
      {
         assign_voter_to_group(state, *iter);
         state.last_processed = iter->member;
      }
      return max_steps;
   }

   uint32_t elections::build_groups(current_election_state_build_groups& state, uint32_t max_steps)
   {
      for (; max_steps > 0 && state.level < state.config.size(); ++state.level)
      {
         for (; max_steps > 0 && state.offset < state.config[state.level].num_groups;
              --max_steps, ++state.offset)
         {
            build_group(state, state.level, state.offset);
         }
         if (state.offset == state.config[state.level].num_groups)
         {
            state.offset = 0;
         }
      }
      return max_steps;
   }

   uint32_t elections::prepare_election(uint32_t max_steps)
   {
      auto state_variant = state_sing.get();
      if (auto* state = std::get_if<current_election_state_init_voters>(&state_variant))
      {
         max_steps = randomize_voters(*state, max_steps);
         if (max_steps > 0)
         {
            state_variant =
                current_election_state_group_voters{make_election_config(state->next_member_idx)};
         }
      }
      if (auto* state = std::get_if<current_election_state_group_voters>(&state_variant))
      {
         max_steps = group_voters(*state, max_steps);
         if (max_steps > 0)
         {
            state_variant = current_election_state_build_groups{std::move(state->config)};
         }
      }
      if (auto* state = std::get_if<current_election_state_build_groups>(&state_variant))
      {
         max_steps = build_groups(*state, max_steps);
         if (max_steps > 0)
         {
            state_variant = current_election_state_active{};
            --max_steps;
         }
      }
      state_sing.set(state_variant, contract);
      return max_steps;
   }

   void elections::check_active()
   {
      eosio::check(state_sing.exists(), "No election is running");
      eosio::check(std::holds_alternative<current_election_state_active>(state_sing.get()),
                   "The election is not ready for voting");
   }

   void elections::vote(uint64_t group_id, eosio::name voter, eosio::name candidate)
   {
      eosio::require_auth(voter);
      check_active();
      auto check_member = [&](eosio::name member) -> const auto&
      {
         auto it = vote_tb.find(member.value);
         if (it == vote_tb.end() || it->group_id != group_id)
         {
            eosio::check(false, member.to_string() + " is not a member of group " +
                                    std::to_string(group_id));
         }
         return *it;
      };
      const auto& vote = check_member(voter);
      check_member(candidate);
      eosio::check(vote.candidate == eosio::name{}, voter.to_string() + " has already voted");
      vote_tb.modify(vote, contract, [&](auto& row) { row.candidate = candidate; });
   }

   void elections::finish_group(uint64_t group_id)
   {
      check_active();
      // count votes
      auto group_idx = vote_tb.get_index<"bygroup"_n>();
      auto iter = group_idx.lower_bound(group_id);
      auto end = group_idx.end();
      std::map<eosio::name, uint8_t> votes_by_candidate;
      std::vector<eosio::name> group_members;
      uint8_t total_votes = 0;
      while (iter != end && iter->group_id == group_id)
      {
         if (iter->candidate != eosio::name())
         {
            ++votes_by_candidate[iter->candidate];
            ++total_votes;
         }
         group_members.push_back(iter->member);
         iter = group_idx.erase(iter);
      }
      const auto& group = group_tb.get(group_id, ("No group " + std::to_string(group_id)).c_str());
      eosio::check(total_votes <= group.group_size,
                   "Invariant failure: wrong number of vote records");
      const uint8_t missing_votes = group.group_size - total_votes;
      eosio::check(total_votes > 0, "No one has voted");
      auto best = std::max_element(
          votes_by_candidate.begin(), votes_by_candidate.end(),
          [](const auto& lhs, const auto& rhs) { return lhs.second < rhs.second; });
      if (3 * best->second > 2 * group.group_size)
      {
         // Either finalize the election or move to the next round
         if (group.next_group == 0)
         {
            state_sing.remove();
            election_state_singleton results(contract, default_scope);
            auto result = std::get<election_state_v0>(results.get());
            result.lead_representative = best->first;
            result.board = std::move(group_members);
            results.set(result, contract);
         }
         else
         {
            vote_tb.emplace(contract, [&](auto& row) {
               row.member = best->first;
               row.group_id = group.next_group;
            });
         }
      }
      else if (3 * (best->second + missing_votes) <= 2 * group.group_size)
      {
         // No consensus possible
         const auto& next_group =
             group_tb.get(group.next_group, "Oops.  The board cannot reach consensus.");
         // TODO: is it correct to reduce the group size of the next layer?
         // Doing so means that non-reporting vs. reporting consensus failure
         // can affect the results of the next layer.
         // Not doing so, means that it's harder and maybe impossible for later layers to reach consensus.
         group_tb.modify(next_group, eosio::same_payer, [](auto& row) { --row.group_size; });
      }
      else
      {
         eosio::check(false, "Consensus is possible but has not been reached.  Need more votes.");
      }
      group_tb.erase(group);
   }
}  // namespace eden
