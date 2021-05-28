#pragma once

#include <constants.hpp>
#include <eosio/bytes.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/singleton.hpp>

namespace eden
{
   struct election_state_v0
   {
      uint64_t election_sequence = 0;  // incremented when an election starts
      eosio::name lead_representative;
      std::vector<eosio::name> board;
      eosio::block_timestamp last_election_time;
   };
   EOSIO_REFLECT(election_state_v0,
                 election_sequence,
                 lead_representative,
                 board,
                 last_election_time);
   using election_state_singleton =
       eosio::singleton<"elect.state"_n, std::variant<election_state_v0>>;

   // Invariants:
   // to initiate an election, all election tables must be empty.
   // when an election is finished they must be cleared
   // Note: this means that election tables do not need to be
   // versioned.  Just wait to update the contract until the
   // election is over.

   // Group ID == 0 shall not exist.
   struct group
   {
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
   struct vote
   {
      eosio::name member;
      uint64_t group_id;
      eosio::name candidate = {};
      uint64_t primary_key() const { return member.value; }
      uint64_t by_group() const { return group_id; }
   };
   EOSIO_REFLECT(vote, member, group_id, candidate);
   using vote_table_type = eosio::multi_index<
       "votes"_n,
       vote,
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
      uint8_t group_max_size() const { return (num_participants + num_groups - 1) / num_groups; }
      uint16_t num_short_groups() const { return group_max_size() * num_groups - num_participants; }
      // invariants:
      // num_groups * group_max_size - num_short_groups = num_participants
      // group_max_size <= 12
      // num_short_groups < num_groups
   };
   EOSIO_REFLECT(election_round_config, num_participants, num_groups)

   using election_config = std::vector<election_round_config>;

   // Implements a PRNG using sha256 over a counter.
   //
   // Algorithms using the engine must ensure that the data that
   // they operate on is fully determined before the seed is
   // generated.
   struct election_rng
   {
      election_rng() = default;
      explicit election_rng(const eosio::checksum256& seed);
      using result_type = uint32_t;
      static constexpr result_type min() { return 0; }
      static constexpr result_type max() { return 0xFFFFFFFFu; }
      result_type operator()();
      char inbuf[40];  // seed + 8 byte counter
      char outbuf[32];
      uint8_t index;
   };
   EOSIO_REFLECT(election_rng, inbuf, outbuf, index)

   // election states:
   //
   // There is always an election scheduled.
   //
   // - registration
   // - seeding
   // - generation
   // - voting
   // - ending round
   // - seeding final
   // - choose final

   struct current_election_state_pending_date
   {
   };
   EOSIO_REFLECT(current_election_state_pending_date);

   struct current_election_state_registration
   {
      eosio::block_timestamp start_time;
   };
   EOSIO_REFLECT(current_election_state_registration, start_time);

   struct election_seeder
   {
      eosio::checksum256 current{0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
                                 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
      eosio::block_timestamp start_time;
      eosio::block_timestamp end_time;
      void update(eosio::input_stream& bytes);
   };
   EOSIO_REFLECT(election_seeder, current, start_time, end_time);

   struct current_election_state_seeding
   {
      election_seeder seed;
   };
   EOSIO_REFLECT(current_election_state_seeding, seed);

   // In this phase, every voter is assigned a unique random integer id in [0,N)
   struct current_election_state_init_voters
   {
      uint16_t next_member_idx;
      election_rng rng;
      eosio::name last_processed = {};
   };
   EOSIO_REFLECT(current_election_state_init_voters, next_member_idx, rng, last_processed)

   // In this phase, the voters ids from the init phase are used to assign them to
   // a first layer group.
   struct current_election_state_group_voters
   {
      election_config config;
      eosio::name last_processed = {};
   };
   EOSIO_REFLECT(current_election_state_group_voters, config, last_processed)

   // Organize groups into a tree.  The tree structure is deterministically
   // computed based on each node's level and index within the level.
   struct current_election_state_build_groups
   {
      election_config config;
      uint8_t level = 0;
      uint16_t offset = 0;
   };
   EOSIO_REFLECT(current_election_state_build_groups, config, level, offset)

   struct current_election_state_active
   {
   };
   EOSIO_REFLECT(current_election_state_active)

   using current_election_state = std::variant<current_election_state_pending_date,
                                               current_election_state_registration,
                                               current_election_state_seeding,
                                               current_election_state_init_voters,
                                               current_election_state_group_voters,
                                               current_election_state_build_groups,
                                               current_election_state_active>;
   using current_election_state_singleton =
       eosio::singleton<"elect.curr"_n, current_election_state>;

   // Requirements:
   // - Except for the last round, the group size shall be in [4,6]
   // - The last round has a minimum group size of 3
   // - The maximum group size shall be as small as possible
   // - The group sizes within a round shall have a maximum difference of 1
   //
   // \post config.back().num_groups == 1 (unless num_participants < 1)
   // \post config.front().num_participants() == num_participants (unless num_participants < 1)
   // \post config[i].num_groups == config[i+1].num_participants
   election_config make_election_config(uint16_t num_participants);

   // Is the full election schedule determined up front, or can the schedule for
   // later rounds depend on whether groups from earlier rounds failed to
   // reach consensus?
   // If it isn't determined up front, does that introduce the possibility of
   // intentional consensus failure to manipulate the overall results?

   class elections
   {
     private:
      eosio::name contract;
      group_table_type group_tb;
      vote_table_type vote_tb;
      current_election_state_singleton state_sing;
      void check_active();

      void add_voter(current_election_state_init_voters& state, eosio::name member);
      void assign_voter_to_group(current_election_state_group_voters& state, const vote& v);
      void build_group(current_election_state_build_groups& state, uint8_t level, uint16_t offset);
      uint32_t randomize_voters(current_election_state_init_voters& state, uint32_t max_steps);
      uint32_t group_voters(current_election_state_group_voters& state, uint32_t max_steps);
      uint32_t build_groups(current_election_state_build_groups& state, uint32_t max_steps);

     public:
      explicit elections(eosio::name contract)
          : contract(contract),
            group_tb(contract, default_scope),
            vote_tb(contract, default_scope),
            state_sing(contract, default_scope)
      {
      }
      void set_time(uint8_t day, const std::string& time);
      void set_default_election(eosio::time_point_sec origin_time);
      void trigger_election();
      void seed(const eosio::bytes& btc_header);
      void start_election(const eosio::checksum256& seed);
      uint32_t prepare_election(uint32_t max_steps);
      // \pre voter is a member of the group
      // \pre voter has not yet reported his vote in this group
      // Don't report your vote until your group has reached consensus.
      // You won't be able to change it.
      // TODO: will this lead to insta-locking votes?  If we allow it
      // to change, is it a problem that finishgroup cannot know that
      // a user doesn't intend to change his vote?
      void vote(uint64_t group_id, eosio::name voter, eosio::name candidate);
      // \pre more than 2/3 of the group members vote for the same candidate
      // OR the remaining votes + the votes for the candidate with the most votes <= 2/3 of the group.
      void finish_group(uint64_t group_id);
   };

}  // namespace eden
