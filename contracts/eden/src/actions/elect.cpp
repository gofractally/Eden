#include <accounts.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <members.hpp>
#include <migrations.hpp>

namespace eden
{
   void eden::electdonate(eosio::name payer, const eosio::asset& quantity)
   {
      eosio::require_auth(payer);
      globals globals{get_self()};

      accounts user_accounts{get_self()};
      accounts internal_accounts{get_self(), "owned"_n};

      eosio::check(quantity == globals.get().election_donation, "incorrect donation");
      user_accounts.sub_balance(payer, quantity);
      migrations migrations{get_self()};
      eosio::check(migrations.is_completed<migrate_account_v0>(), "Please migrate tables first");
      internal_accounts.add_balance("master"_n, quantity);

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

   void eden::electprepare(uint32_t max_steps)
   {
      elections elections(get_self());
      eosio::check(elections.prepare_election(max_steps) != max_steps, "Nothing to do");
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
      eosio::check(elections.finish_round(max_steps) != max_steps, "Nothing to do");
   }

}  // namespace eden
