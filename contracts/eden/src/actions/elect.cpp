#include <accounts.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <encrypt.hpp>
#include <members.hpp>
#include <migrations.hpp>

namespace eden
{
   void eden::electsettime(eosio::time_point_sec election_time)
   {
      eosio::require_auth(get_self());
      elections{get_self()}.set_next_election_time(election_time);
   }

   void eden::electconfig(uint8_t election_day, const std::string& election_time)
   {
      eosio::require_auth(get_self());

      elections elections{get_self()};
      elections.set_time(election_day, election_time);
   }

   void eden::electopt(eosio::name voter, bool participating)
   {
      eosio::require_auth(voter);

      members members{get_self()};
      const auto& member = members.get_member(voter);
      if (participating)
      {
         eosio::check(member.election_participation_status() == not_in_election,
                      "Not currently opted out");
      }
      else
      {
         eosio::check(member.election_participation_status() == in_election,
                      "Not currently opted in");
      }
      members.election_opt(member, participating);
   }

   void eden::electseed(const eosio::bytes& btc_header)
   {
      elections elections{get_self()};
      elections.seed(btc_header);
   }

   void eden::electmeeting(eosio::name account,
                           uint8_t round,
                           const std::vector<encrypted_key>& keys,
                           const eosio::bytes& data,
                           const std::optional<eosio::bytes>& old_data)
   {
      eosio::require_auth(account);
      members members{get_self()};
      elections elections{get_self()};
      auto group_id = elections.get_group_id(account, round);
      members.check_keys(elections.get_group_members(group_id), keys);
      encrypt encrypt{get_self(), "election"_n};
      encrypt.set(group_id, keys, data, old_data);
   }

   void eden::electvote(uint8_t round, eosio::name voter, eosio::name candidate)
   {
      eosio::require_auth(voter);
      elections elections(get_self());
      elections.vote(round, voter, candidate);
   }

   void eden::electprocess(uint32_t max_steps)
   {
      elections elections(get_self());
      auto remaining = elections.prepare_election(max_steps);
      remaining = elections.finish_round(remaining);
      eosio::check(remaining != max_steps, "Nothing to do");
   }

}  // namespace eden
