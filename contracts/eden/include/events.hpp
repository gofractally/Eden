#pragma once

#include <eosio/asset.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/name.hpp>
#include <eosio/reflection.hpp>
#include <eosio/time.hpp>
#include <variant>
#include <vector>

namespace eden
{
   // Election event order:
   //    election_event_schedule: repeatable, with different scheduled time
   //    election_event_begin
   //    election_event_seeding: repeatable, with different seed
   //    election_event_end_seeding
   //    election_event_config_summary
   //
   //    For each round:
   //       election_event_create_round
   //       election_event_create_group (for each group)
   //       election_event_begin_round_voting
   //       if final round:
   //          election_event_seeding: repeatable, with different seed
   //          election_event_end_seeding
   //       election_event_end_round_voting
   //       election_event_report_group (for each group)
   //       election_event_end_round
   //
   //    election_event_end

   struct election_event_schedule
   {
      eosio::block_timestamp election_time;
      uint16_t election_threshold;
   };
   EOSIO_REFLECT(election_event_schedule, election_time, election_threshold)

   struct election_event_begin
   {
      eosio::block_timestamp election_time;
   };
   EOSIO_REFLECT(election_event_begin, election_time)

   struct election_event_seeding
   {
      eosio::block_timestamp election_time;
      eosio::block_timestamp start_time;
      eosio::block_timestamp end_time;
      eosio::checksum256 seed;
   };
   EOSIO_REFLECT(election_event_seeding, election_time, start_time, end_time, seed)

   struct election_event_end_seeding
   {
      eosio::block_timestamp election_time;
   };
   EOSIO_REFLECT(election_event_end_seeding, election_time)

   struct election_event_config_summary
   {
      eosio::block_timestamp election_time;
      uint8_t num_rounds;
      uint16_t num_participants;
   };
   EOSIO_REFLECT(election_event_config_summary, election_time, num_rounds, num_participants)

   struct election_event_create_round
   {
      eosio::block_timestamp election_time;
      uint8_t round;
      bool requires_voting;
      uint16_t num_participants;
      uint16_t num_groups;
   };
   EOSIO_REFLECT(election_event_create_round,
                 election_time,
                 round,
                 requires_voting,
                 num_participants,
                 num_groups)

   struct election_event_create_group
   {
      eosio::block_timestamp election_time;
      uint8_t round;
      std::vector<eosio::name> voters;
   };
   EOSIO_REFLECT(election_event_create_group, election_time, round, voters)

   struct election_event_begin_round_voting
   {
      eosio::block_timestamp election_time;
      uint8_t round;
      eosio::block_timestamp voting_begin;
      eosio::block_timestamp voting_end;
   };
   EOSIO_REFLECT(election_event_begin_round_voting, election_time, round, voting_begin, voting_end)

   struct election_event_end_round_voting
   {
      eosio::block_timestamp election_time;
      uint8_t round;
   };
   EOSIO_REFLECT(election_event_end_round_voting, election_time, round)

   struct vote_report
   {
      eosio::name voter;
      eosio::name candidate;
   };
   EOSIO_REFLECT(vote_report, voter, candidate);

   struct election_event_report_group
   {
      eosio::block_timestamp election_time;
      uint8_t round;
      eosio::name winner;
      std::vector<vote_report> votes;
   };
   EOSIO_REFLECT(election_event_report_group, election_time, round, winner, votes)

   struct election_event_end_round
   {
      eosio::block_timestamp election_time;
      uint8_t round;
   };
   EOSIO_REFLECT(election_event_end_round, election_time, round)

   struct election_event_end
   {
      eosio::block_timestamp election_time;
   };
   EOSIO_REFLECT(election_event_end, election_time)

   // Distribution event order:
   //    distribution_event_schedule
   //    distribution_event_reserve
   //    distribution_event_begin
   //    distribution_event_return_excess (optional)
   //    distribution_event_fund
   //    distribution_event_end
   // No particular order:
   //    distribution_event_return

   struct distribution_event_schedule
   {
      eosio::block_timestamp distribution_time;
   };
   EOSIO_REFLECT(distribution_event_schedule, distribution_time)

   struct distribution_event_reserve
   {
      eosio::block_timestamp distribution_time;
      eosio::name pool;
      eosio::asset target_amount;
   };
   EOSIO_REFLECT(distribution_event_reserve, distribution_time, pool, target_amount)

   struct distribution_event_begin
   {
      eosio::block_timestamp distribution_time;
      std::vector<eosio::asset> rank_distribution;
   };
   EOSIO_REFLECT(distribution_event_begin, distribution_time, rank_distribution)

   struct distribution_event_return_excess
   {
      eosio::block_timestamp distribution_time;
      eosio::name pool;
      eosio::asset amount;
   };
   EOSIO_REFLECT(distribution_event_return_excess, distribution_time, pool, amount)

   struct distribution_event_fund
   {
      eosio::name owner;
      eosio::block_timestamp distribution_time;
      uint8_t rank;
      eosio::asset balance;
   };
   EOSIO_REFLECT(distribution_event_fund, owner, distribution_time, rank, balance)

   struct distribution_event_end
   {
      eosio::block_timestamp distribution_time;
   };
   EOSIO_REFLECT(distribution_event_end, distribution_time)

   struct distribution_event_return
   {
      eosio::name owner;
      eosio::block_timestamp distribution_time;
      uint8_t rank;
      eosio::asset amount;
      eosio::name pool;
   };
   EOSIO_REFLECT(distribution_event_return, owner, distribution_time, rank, amount, pool)

   using event = std::variant<election_event_schedule,
                              election_event_begin,
                              election_event_seeding,
                              election_event_end_seeding,
                              election_event_config_summary,
                              election_event_create_round,
                              election_event_create_group,
                              election_event_begin_round_voting,
                              election_event_end_round_voting,
                              election_event_report_group,
                              election_event_end_round,
                              election_event_end,
                              distribution_event_schedule,
                              distribution_event_reserve,
                              distribution_event_begin,
                              distribution_event_return_excess,
                              distribution_event_fund,
                              distribution_event_end,
                              distribution_event_return>;

   void push_event(const event& e, eosio::name self);
   void send_events(eosio::name self);
}  // namespace eden
