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

   void eden::genesisdelay(uint64_t induction_id, eosio::time_point new_expiration)
   {
      require_auth(get_self());
      inductions inductions(get_self());
      const auto& induction = inductions.get_induction(induction_id);

      eosio::check(globals(get_self()).get().stage == contract_stage::genesis, "Not in genesis");
      inductions.update_expiration(induction, new_expiration);
   }

   void eden::addtogenesis(eosio::name newmember)
   {
      require_auth(get_self());
      members members(get_self());

      eosio::check(globals(get_self()).get().stage == contract_stage::genesis, "Not in genesis");

      inductions inductions(get_self());

      std::vector<eosio::name> initial_members;
      for (const auto& member : members.get_table())
      {
         initial_members.push_back(member.account());
         // If the NFTs for this member have already been issued by a sufficiently
         // recent version of the eden contract which leaves the max_supply unlocked
         // until genesis is complete, then retroactively issue an NFT to the
         // new genesis member.
         if (member.status() == active_member &&
             !atomicassets::is_locked(atomic_assets_account, get_self(), member.nft_template_id()))
         {
            inductions.mint_nft(member.nft_template_id(), newmember);
         }
      }

      members.create(newmember);

      // for each current induction, add newmember as a witness
      for (const auto& induction : inductions.get_table())
      {
         inductions.add_endorsement(induction, newmember, true);
      }

      uint64_t induction_id = members.stats().active_members + members.stats().pending_members;
      auto inviter = get_self();
      auto invitee = newmember;

      // Extract the genesis video from an existing induction
      eosio::check(inductions.get_table().begin() != inductions.get_table().end(), "No inductions");
      auto genesis_video = inductions.get_table().begin()->video();

      auto total_endorsements = initial_members.size();
      inductions.create_induction(induction_id, inviter, invitee, total_endorsements,
                                  genesis_video);

      for (const auto& endorser : initial_members)
      {
         if (endorser != invitee)
         {
            inductions.create_endorsement(inviter, invitee, endorser, induction_id);
         }
      }
   }

   void eden::genesis(std::string community,
                      eosio::symbol community_symbol,
                      eosio::asset minimum_donation,
                      std::vector<eosio::name> initial_members,
                      std::string genesis_video,
                      atomicassets::attribute_map collection_attributes,
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
                                    initial_market_fee, collection_attributes);
   }

}  // namespace eden
