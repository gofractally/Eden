#pragma once

#include <eosio/fixed_bytes.hpp>
#include <eosio/name.hpp>
#include <eosio/reflection.hpp>
#include <eosio/time.hpp>
#include <variant>
#include <vector>

namespace eden
{
   struct election_event_schedule
   {
      eosio::block_timestamp election_time;
      uint16_t election_threshold;
   };
   EOSIO_REFLECT(election_event_schedule, election_time, election_threshold)

   struct election_event_seeding
   {
      eosio::block_timestamp start_time;
      eosio::block_timestamp end_time;
      eosio::checksum256 seed;
   };
   EOSIO_REFLECT(election_event_seeding, start_time, end_time, seed)

   struct election_event_start_create_groups
   {
   };
   EOSIO_REFLECT(election_event_start_create_groups)

   struct election_event_create_group
   {
      uint8_t round;
      std::vector<eosio::name> voters;
   };
   EOSIO_REFLECT(election_event_create_group, round, voters)

   struct election_event_begin_round
   {
      uint8_t round;
      uint8_t num_rounds;
      uint16_t num_participants;
      uint16_t num_groups;
      eosio::block_timestamp round_begin;
      eosio::block_timestamp round_end;
   };
   EOSIO_REFLECT(election_event_begin_round,
                 round,
                 num_rounds,
                 num_participants,
                 num_groups,
                 round_begin,
                 round_end)

   struct election_event_end_round
   {
   };
   EOSIO_REFLECT(election_event_end_round)

   struct vote_report
   {
      eosio::name voter;
      eosio::name candidate;
   };
   EOSIO_REFLECT(vote_report, voter, candidate);

   struct election_event_report_group
   {
      uint8_t round;
      std::vector<vote_report> votes;
   };
   EOSIO_REFLECT(election_event_report_group, round, votes)

   using event = std::variant<election_event_schedule,
                              election_event_seeding,
                              election_event_start_create_groups,
                              election_event_create_group,
                              election_event_begin_round,
                              election_event_end_round,
                              election_event_report_group>;

   extern std::vector<event> events;
   inline void push_event(const event& e) { events.push_back(e); }
   void send_events(eosio::name self);
}  // namespace eden
