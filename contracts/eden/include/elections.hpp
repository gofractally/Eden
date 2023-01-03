#pragma once

#include <boost/logic/tribool.hpp>
#include <constants.hpp>
#include <eosio/bytes.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/singleton.hpp>
#include <globals.hpp>

namespace eden
{
   struct election_state_v0
   {
      eosio::name lead_representative;
      std::vector<eosio::name> board;
      eosio::block_timestamp last_election_time;
   };
   EOSIO_REFLECT(election_state_v0, lead_representative, board, last_election_time);
   using election_state_variant = std::variant<election_state_v0>;
   using election_state_singleton = eosio::singleton<"elect.state"_n, election_state_variant>;

   // Invariants:
   // a member can only have a vote record in one group at a time
   // When a member advances to the next round, the vote record for the previous round must be erased
   struct vote
   {
      eosio::name member;
      uint8_t round;
      uint16_t index;
      eosio::name candidate = {};
      uint64_t primary_key() const { return member.value; }
      uint64_t by_index() const { return round << 16 | index; }
   };
   EOSIO_REFLECT(vote, member, round, index, candidate);
   using vote_table_type = eosio::multi_index<
       "votes"_n,
       vote,
       eosio::indexed_by<"bygroup"_n, eosio::const_mem_fun<vote, uint64_t, &vote::by_index>>>;

   // the voters are the members at the start of the election
   // Ensure that there are no races with inductions that occur in the middle of an election
   // ensure that every member is in a group
   // ensure that no member is in more than one group
   // Ensure that groups have a consistent size <= 12

   // decide election group size:
   struct election_round_config
   {
      uint16_t num_participants;
      uint16_t num_groups;
      constexpr uint8_t group_max_size() const
      {
         return (num_participants + num_groups - 1) / num_groups;
      }
      constexpr uint16_t num_short_groups() const
      {
         return group_max_size() * num_groups - num_participants;
      }

      constexpr uint32_t num_large_groups() const { return num_groups - num_short_groups(); }
      constexpr uint32_t group_min_size() const { return group_max_size() - 1; }
      uint32_t member_index_to_group(uint32_t idx) const;
      uint32_t group_to_first_member_index(uint32_t idx) const;
      // invariants:
      // num_groups * group_max_size - num_short_groups = num_participants
      // group_max_size <= 12
      // num_short_groups < num_groups
   };
   EOSIO_REFLECT(election_round_config, num_participants, num_groups)
   EOSIO_COMPARE(election_round_config);

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
      eosio::checksum256 seed() const;
      std::vector<uint8_t> buf;
      uint8_t index;
   };
   EOSIO_REFLECT(election_rng, buf, index)
   EOSIO_COMPARE(election_rng);

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
   EOSIO_COMPARE(current_election_state_pending_date);

   struct current_election_state_registration_v0
   {
      eosio::block_timestamp start_time;
      // The election may be moved forward if active membership reached this
      uint16_t election_threshold;
      // The number of times that the election schedule has been updated
      // always > 0
      uint8_t election_schedule_version = 1;
   };
   EOSIO_REFLECT(current_election_state_registration_v0, start_time, election_threshold);
   EOSIO_COMPARE(current_election_state_registration_v0);

   struct current_election_state_registration_v1 : current_election_state_registration_v0
   {
   };
   EOSIO_REFLECT(current_election_state_registration_v1,
                 base current_election_state_registration_v0,
                 election_schedule_version);
   EOSIO_COMPARE(current_election_state_registration_v1);

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
   EOSIO_COMPARE(election_seeder);

   struct current_election_state_seeding_v0
   {
      election_seeder seed;
      std::uint8_t election_schedule_version = 1;
   };
   EOSIO_REFLECT(current_election_state_seeding_v0, seed);
   EOSIO_COMPARE(current_election_state_seeding_v0);

   struct current_election_state_seeding_v1 : current_election_state_seeding_v0
   {
   };
   EOSIO_REFLECT(current_election_state_seeding_v1,
                 base current_election_state_seeding_v0,
                 election_schedule_version)

   // In this phase, every voter is assigned a unique random integer id in [0,N)
   struct current_election_state_init_voters_v0
   {
      uint16_t next_member_idx;
      election_rng rng;
      eosio::name last_processed = {};
      uint16_t next_report_index = 0;
      uint8_t election_schedule_version = 1;
   };
   EOSIO_REFLECT(current_election_state_init_voters_v0,
                 next_member_idx,
                 rng,
                 last_processed,
                 next_report_index)
   EOSIO_COMPARE(current_election_state_init_voters_v0);

   struct current_election_state_init_voters_v1 : current_election_state_init_voters_v0
   {
   };
   EOSIO_REFLECT(current_election_state_init_voters_v1,
                 base current_election_state_init_voters_v0,
                 election_schedule_version)
   EOSIO_COMPARE(current_election_state_init_voters_v1);

   struct current_election_state_active
   {
      uint8_t round;
      election_round_config config;
      eosio::checksum256 saved_seed;
      eosio::block_timestamp round_end;
   };
   EOSIO_REFLECT(current_election_state_active, round, config, saved_seed, round_end)
   EOSIO_COMPARE(current_election_state_active);

   struct current_election_state_post_round
   {
      election_rng rng;
      uint8_t prev_round;
      election_round_config prev_config;
      uint16_t next_input_index;
      uint16_t next_output_index;
      uint16_t next_report_index;
   };
   EOSIO_REFLECT(current_election_state_post_round,
                 rng,
                 prev_round,
                 prev_config,
                 next_input_index,
                 next_output_index,
                 next_report_index)
   EOSIO_COMPARE(current_election_state_post_round);

   struct current_election_state_final
   {
      election_seeder seed;
   };
   EOSIO_REFLECT(current_election_state_final, seed)
   EOSIO_COMPARE(current_election_state_final);

   using current_election_state = std::variant<current_election_state_pending_date,
                                               current_election_state_registration_v0,
                                               current_election_state_seeding_v0,
                                               current_election_state_init_voters_v0,
                                               current_election_state_active,
                                               current_election_state_post_round,
                                               current_election_state_final,
                                               current_election_state_registration_v1,
                                               current_election_state_seeding_v1,
                                               current_election_state_init_voters_v1>;
   using current_election_state_singleton =
       eosio::singleton<"elect.curr"_n, current_election_state>;

   template <typename T>
   T* get_if_derived(current_election_state* state)
   {
      return std::visit(
          [](auto& s) -> T*
          {
             if constexpr (std::is_base_of_v<T, std::decay_t<decltype(s)>>)
             {
                return &s;
             }
             else
             {
                return nullptr;
             }
          },
          *state);
   }

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

   class elections
   {
     private:
      eosio::name contract;
      vote_table_type vote_tb;
      current_election_state_singleton state_sing;
      globals globals;

      void set_state_sing(const current_election_state& new_value);
      void add_voter(election_rng& rng, uint8_t round, uint16_t& next_index, eosio::name member);
      uint32_t randomize_voters(current_election_state_init_voters_v0& state, uint32_t max_steps);
      std::vector<eosio::name> extract_board();
      void finish_election(std::vector<eosio::name>&& board, eosio::name winner);
      bool remove_from_board(eosio::name member);

     public:
      explicit elections(eosio::name contract)
          : contract(contract),
            vote_tb(contract, default_scope),
            state_sing(contract, default_scope),
            globals(contract)
      {
      }
      current_election_state_active check_active();

      void set_board_permission(const std::vector<eosio::name>& board);
      void link_board_permission();
      std::optional<eosio::block_timestamp> get_next_election_time();
      std::uint8_t election_schedule_version();
      void set_time(uint8_t day, const std::string& time);
      void set_default_election(eosio::time_point_sec origin_time);
      void trigger_election();
      void set_next_election_time(eosio::time_point election_time);
      void seed(const eosio::bytes& btc_header);
      void start_election();
      uint32_t prepare_election(uint32_t max_steps);
      uint32_t finish_round(uint32_t max_steps);
      void on_resign(eosio::name member);
      void on_rename(eosio::name old_account, eosio::name new_account);
      // \pre voter and candidate are members of the same group
      void vote(uint8_t round, eosio::name voter, eosio::name candidate);
      boost::logic::tribool can_upload_video(uint8_t round, eosio::name voter);
      uint64_t get_group_id(eosio::name voter, uint8_t round);
      std::vector<eosio::name> get_group_members(uint64_t group_id);
      eosio::time_point get_round_time_point();
      void clear_all();
   };

}  // namespace eden
