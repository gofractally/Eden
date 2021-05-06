#pragma once

#include <eosio/multi_index.hpp>
#include <constants.hpp>

namespace eden
{

   // Invariants:
   // to initiate an election, all election tables must be empty.
   // when an election is finished they must be cleared
   // Note: this means that election tables do not need to be
   // versioned.  Just wait to update the contract until the
   // election is over.

   // Group ID == 0 shall not exist.
   struct group {
      uint64_t group_id;
      uint64_t next_group;
      uint8_t group_size;
      uint64_t primary_key() const { return group_id; } 
   };
   EOSIO_REFLECT(group, group_id, next_group, group_size);
   using group_table_type = eosio::multi_index<"group"_n, group>;

   // Invariants:
   // a member can only have a vote record in one group at a time
   // When a member advances to the next round, the vote record for the previous round must be erased
   struct vote {
      eosio::name member;
      uint64_t group_id;
      eosio::name candidate = {};
      uint64_t primary_key() const { return member.value; }
      uint64_t by_group() const { return group_id; }
   };
   EOSIO_REFLECT(vote, member, group_id, candidate);
   using vote_table_type = eosio::multi_index<"votes"_n, vote,
                                              eosio::indexed_by<"bygroup"_n, eosio::const_mem_fun<vote, uint64_t, &vote::by_group>>>;

   // the voters are the members at the start of the election
   // Ensure that there are no races with inductions that occur in the middle of an election
   // ensure that every member is in a group
   // ensure that no member is in more than one group
   // Ensure that groups have a consistent size <= 12
   // how to handle non-participation?
   // How is an election triggered?
   
   // decide election group size:
   struct election_round_config
   {
      uint16_t num_participants;
      uint16_t num_groups;
      uint8_t  group_max_size() const { return (num_participants + num_groups - 1) / num_groups; }
      uint16_t num_short_groups() const { return group_max_size() * num_groups - num_participants; }
      // invariants:
      // num_groups * group_max_size - num_short_groups = num_participants
      // group_max_size <= 12
      // num_short_groups < num_groups
   };

   constexpr std::size_t ceil_log12(uint16_t x) {
      std::size_t result = 0;
      for(uint32_t i = 1; i < x; ++result, i *= 12) {}
      return result;
   }
   
   struct rational {
      uint8_t num;
      uint8_t den;
   };
   // \pre 0 <= y <= 1
   // \pre 0 < y.den <= 4
   // \pre 0 <= x <= 10,000
   inline uint16_t ceil_pow(uint16_t x, rational y)
   {
      // result = x^(n/d);
      // result^d = x^n;
      // result^d - x^n = 0;
      //
      // result^d - x^n >= 0
      // (result-1)^d - x^n < 0

      // Could be implemented entirely in integer arithmetic using Newton's method,
      // but performance probably doesn't matter, since we only need to do it once
      // per election.
      return static_cast<uint16_t>(std::ceil(std::pow(static_cast<double>(x), static_cast<double>(y.num)/(y.den))));
   }

   using election_config = std::vector<election_round_config>;
   election_config make_election_config(uint16_t num_participants)
   {
      std::size_t num_rounds = ceil_log12(num_participants);
      election_config result(num_rounds);
      if(num_rounds > 0)
      {
         uint16_t prev_participants = num_participants;
         for(std::size_t i = 0; i < num_rounds; ++i)
         {
            result[i].num_participants = prev_participants;
            prev_participants = result[i].num_groups = ceil_pow(num_participants, {static_cast<uint8_t>(num_rounds - i - 1), static_cast<uint8_t>(num_rounds)});
         }
      }
      return result;
   }
   // invariants:
   // config.back().num_groups == 1
   // config.front().num_participants() == num_active_members
   // config[i].num_groups == config[i+1].num_participants
   //
   // The number of rounds shall be minimal
   // The group sizes shall be chosen to minimize the variance of max group size
   // Should we use larger groups in earlier rounds or in later rounds?
   //
   // config.size() == ceil(log_12(num_active_members))
   // config[i].num_groups = ceil(num_active_members^{(config.size()-i-1)/config.size()})

   // Is the full election schedule determined up front, or can the schedule for
   // later rounds depend on whether groups from earlier rounds failed to
   // reach consensus?

   // How much CPU does it take to process the entire members table in a single
   // transaction to prepare the election?
   // Alternatively, is there an incremental algorithm from selecting
   // groups randomly that only reads a part of the members table at a
   // time?
   
   class elections
   {
   private:
      eosio::name contract;
      group_table_type group_tb;
      vote_table_type vote_tb;
   public:
      explicit elections(eosio::name contract) : contract(contract), group_tb(contract, default_scope), vote_tb(contract, default_scope) {}
      void startelect();
      void endelect();
      // \pre voter is a member of the group
      // \pre voter has not yet reported his vote in this group
      // Don't report your vote until your group has reached consensus.
      // You won't be able to change it.
      void vote(uint64_t group_id, eosio::name voter, eosio::name candidate);
      // \pre more than 2/3 of the group members vote for the same candidate
      // OR the remaining votes + the votes for the candidate with the most votes <= 2/3 of the group.
      void finishgroup(uint64_t group_id);
   };

}
