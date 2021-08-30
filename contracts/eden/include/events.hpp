#pragma once

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
      eosio::block_timestamp round_begin;
      eosio::block_timestamp round_end;
   };
   EOSIO_REFLECT(election_event_begin_round_voting, election_time, round, round_begin, round_end)

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
                              election_event_end>;

   extern std::vector<event> events;
   void push_event(const event& e, eosio::name self);
   void send_events(eosio::name self);
}  // namespace eden
