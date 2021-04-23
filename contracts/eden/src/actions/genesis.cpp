#include <eden.hpp>
#include <globals.hpp>
#include <inductions.hpp>
#include <members.hpp>

namespace eden
{
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

      members.clear_all();
      inductions.clear_all();

      auto inviter = get_self();

      for (int i = 0; i < initial_members.size(); i++)
      {
         auto induction_id = i + 1;
         const auto& invitee = initial_members[i];
         auto total_endorsements = initial_members.size() - 1;

         members.create(invitee);
         inductions.create_induction(induction_id, get_self(), initial_members[i],
                                     total_endorsements);

         for (const auto& endorser : initial_members)
         {
            if (endorser != invitee)
            {
               inductions.create_endorsement(inviter, invitee, endorser, induction_id);
            }
         }

         inductions.update_video(inductions.get_induction(induction_id), genesis_video);
      }
   }

}  // namespace eden
