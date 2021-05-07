#include <election.hpp>

namespace eden
{
   // Incremental implementation of shuffle
   // After adding all voters, each voter will have unique integer in [0, N) as
   // a group_id.
   void elections::add_voter(election_state_init_voters& state, eosio::name member)
   {
      std::uniform_int_distribution<uint16_t> dist(0, state.next_member_idx);
      auto pos = dist(state.rng);
      if(pos != state.next_member_idx)
      {
         auto group_idx = vote_tb.get_index<"bygroup"_n>();
         const auto& old = group_idx.get(pos);
         group_idx.modify(old, eosio::same_payer, [&](auto& row){
            row.group = state.next_member_idx;
         });
      }
      vote_tb.emplace(contract, contract, [&](auto& row){
         row.member = member;
         row.group_id = pos;
      });
      ++state.next_member_idx;
   }

   void elections::assign_voter_to_group(election_state_group_voters& state, const vote& v)
   {
      vote_tb.modify(v, eosio::same_payer, [](auto& row){
         row.group_id = row.group_id % state.first_level_group_count + 1;
      });
   }

   uint64_t get_group_id(uint64_t level, uint64_t offset) {
      return (level << 16) + offset + 1;
   }

   void elections::build_group(election_state_build_groups& state, uint8_t level, uint16_t offset)
   {
      group_tb.emplace(contract, contract, [&](auto& row){
         row.group_id = get_group_id(level, offset);
         if(level + 1 < state.config.size())
         {
            row.next_group = get_group_id(level + 1, offset % state.config[level + 1].num_groups);
         }
         else
         {
            row.next_group = 0;
         }
         row.group_size = state.config[level].group_max_size();
         if(offset > state.config[level].num_groups - state.config[level].num_short_groups())
         {
            --row.group_size;
         }
      });
   }

   void elections::vote(uint64_t group_id, eosio::name voter, eosio::name candidate)
   {
      eosio::require_auth(voter);
      auto check_member = [&](eosio::name member) -> const auto&
      {
         auto it = vote_tb.find(member.value);
         if(it == vote_tb.end() || it->group_id != group_id)
         {
            eosio::check(false, member.to_string() + " is not a member of group " + std::to_string(group_id));
         }
         return *it;
      };
      const auto& vote = check_member(voter);
      check_member(candidate);
      eosio::check(vote.candidate == eosio::name{}, voter.to_string() + " has already voted");
      vote_tb.modify(vote, contract, [&](auto& row){ row.candidate = candidate; });
   }
   void elections::finishgroup(uint64_t group_id)
   {
      // count votes
      auto group_idx = vote_tb.get_index<"bygroup"_n>();
      auto iter = group_idx.lower_bound(group_id);
      auto end = group_idx.end();
      std::map<eosio::name, uint8_t> votes_by_candidate;
      uint8_t total_votes = 0;
      while(iter != end && iter->group_id == group_id)
      {
         if(iter->candidate != eosio::name())
         {
            ++votes_by_candidate[iter->candidate];
            ++total_votes;
         }
         iter = group_idx.erase(iter);
      }
      const auto& group = group_tb.get(group_id, ("No group " + std::to_string(group_id)).c_str());
      eosio::check(total_votes <= group.group_size, "Invariant failure: wrong number of vote records");
      const uint8_t missing_votes = group.group_size - total_votes;
      eosio::check(total_votes > 0, "No one has voted");
      auto best = std::max_element(votes_by_candidate.begin(), votes_by_candidate.end(), [](const auto& lhs, const auto& rhs){ return lhs.second < rhs.second; });
      if(3*best->second > 2*group.group_size)
      {
         // best
         vote_tb.emplace(contract, [&](auto& row)
         {
            row.member = best->first;
            row.group_id = group.next_group;
         });
      }
      else if(3*(best->second + missing_votes) <= 2*group.group_size)
      {
         // No consensus possible
         const auto& next_group = group_tb.get(group.next_group, "Oops.  The board cannot reach consensus.");
         // TODO: is it correct to reduce the group size of the next layer?
         // Doing so means that non-reporting vs. reporting consensus failure
         // can affect the results of the next layer.
         // Not doing so, means that it's harder and maybe impossible for later layers to reach consensus.
         group_tb.modify(group, eosio::same_payer, [](auto& row){ --row.group_size; });
      }
      else
      {
         eosio::check(false, "Consensus is possible but has not been reached.  Need more votes.");
      }
   }
}
