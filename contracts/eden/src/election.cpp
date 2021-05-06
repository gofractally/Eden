#include <election.hpp>

namespace eden
{

   void elections::startelect(const eosio::checksum256& seed)
   {
      std::vector<eosio::name> all_members;
      // load all members
      // create rng with seed: choose algorithm - does it need to be crypto or is a regular PRNG good enough?
      // With a statistical PRNG, a sophisticated attacker could likely rig things so that the
      // group division is biased in his favor, by exploiting patterns in the PRNG output, even without
      // knowledge or control of the seed.
      // sha256 over {seed,counter}?
      std::shuffle(all_members.begin(), all_members.end(), rng);
      auto config = make_election_config(all_members.size());
      uint64_t group_id = 0;
      uint16_t remaining_short_groups = config[0].num_short_groups;
      uint16_t remaining_in_group = 0;
      if(remaining_short_groups) { --remaining_short_groups; --remaining_in_group; }
      for(auto member : all_members)
      {
         if(remaining_in_group == 0)
         {
            ++group_id;
            remaining_in_group = config[0].group_max_size();
            if(remaining_short_groups) { --remaining_short_groups; --remaining_in_group; }
         }
         // assign member current group_id
      }

      // The above will sort of work, but is hard to divide into chunks

      // What about this:
      uint16_t count = 0;
      for(auto member : all_members)
      {
         ++count;
         uniform_int_distribution<uin16_t> dist(0, count);
         auto pos = dist(rng);
         swap(all_members[pos], all_members[count]);
         // The group can be derived from the index.
         // Store this data structure in the votes table?
      }
      // Randomize the first layer completely.
      // Organize later layers to minimize the difference in
      // overall voting power due to differences in group size.
      // i.e. we don't want one member to be in a smallest group
      // of every level.
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
         // Not doing so, means that it's possible for
         group_tb.modify(group, eosio::same_payer, [](auto& row){ --row.group_size; });
      }
      else
      {
         eosio::check(false, "Consensus is possible but has not been reached.  Need more votes.");
      }
   }
}
