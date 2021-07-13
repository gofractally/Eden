#include <accounts.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <members.hpp>
#include <migrations.hpp>

namespace eden
{
   void eden::electsettime(eosio::time_point_sec election_time)
   {
      eosio::require_auth(get_self());
      elections{get_self()}.set_next_election_time(election_time);
   }

   void eden::electconfig(uint8_t election_day,
                          const std::string& election_time,
                          const eosio::asset& election_donation)
   {
      eosio::require_auth(get_self());

      elections elections{get_self()};
      elections.set_time(election_day, election_time);

      globals globals{get_self()};
      eosio::check(election_donation.symbol == globals.default_token(),
                   "Wrong token for election donation");
      globals.set_election_donation(election_donation);
   }

   void eden::electdonate(eosio::name payer, const eosio::asset& quantity)
   {
      eosio::require_auth(payer);
      globals globals{get_self()};

      accounts user_accounts{get_self()};

      eosio::check(quantity == globals.get().election_donation, "incorrect donation");
      user_accounts.sub_balance(payer, quantity);
      migrations migrations{get_self()};
      eosio::check(migrations.is_completed<migrate_account_v0>(), "Please migrate tables first");
      add_to_pool(get_self(), "master"_n, quantity);

      members members{get_self()};
      const auto& member = members.get_member(payer);
      if (member.election_participation_status() != no_donation)
      {
         eosio::check(false, "Cannot donate at this time");
      }
      members.election_opt(member, true);
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
