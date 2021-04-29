#include <accounts.hpp>
#include <eden-atomicassets.hpp>
#include <eden.hpp>
#include <globals.hpp>
#include <inductions.hpp>
#include <members.hpp>

namespace eden
{
   void eden::clearall()
   {
      require_auth(get_self());
      accounts{get_self()}.clear_all();
      members{get_self()}.clear_all();
      inductions{get_self()}.clear_all();
      get_global_singleton(get_self()).remove();
   }

   void eden::genesis(std::string community,
                      eosio::symbol community_symbol,
                      eosio::asset minimum_donation,
                      std::vector<eosio::name> initial_members,
                      std::string genesis_video,
                      eosio::asset auction_starting_bid,
                      uint32_t auction_duration,
                      eosio::ignore<std::string> memo)
   {
      require_auth(get_self());

      eosio::check(community_symbol == minimum_donation.symbol,
                   "community symbol does not match minimum donation");

      eosio::check(community_symbol == auction_starting_bid.symbol,
                   "community symbol does not match auction starting bid");

      globals{get_self(),
              {.community = community,
               .minimum_donation = minimum_donation,
               .auction_starting_bid = auction_starting_bid,
               .auction_duration = auction_duration,
               .stage = contract_stage::genesis}};
      members members{get_self()};
      inductions inductions{get_self()};

      auto inviter = get_self();
      auto total_endorsements = initial_members.size() - 1;
      uint64_t induction_id = 1;

      for (const auto& invitee : initial_members)
      {
         members.create(invitee);

         inductions.create_induction(induction_id, inviter, invitee, total_endorsements,
                                     genesis_video);

         for (const auto& endorser : initial_members)
         {
            if (endorser != invitee)
            {
               inductions.create_endorsement(inviter, invitee, endorser, induction_id);
            }
         }

         induction_id++;
      }

      const auto collection_name = get_self();
      atomicassets::init_collection(atomic_assets_account, get_self(), collection_name, schema_name,
                                    initial_market_fee);
   }

}  // namespace eden
