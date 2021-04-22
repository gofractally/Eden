#include <eden.hpp>
#include <inductions.hpp>
#include <members.hpp>

namespace eden
{
   void eden::inductinit(uint64_t id,
                         eosio::name inviter,
                         eosio::name invitee,
                         std::vector<eosio::name> witnesses)
   {
      require_auth(inviter);

      globals{get_self()}.check_active();

      members members{get_self()};
      members.check_active_member(inviter);
      for (const auto& witness : witnesses)
      {
         members.check_active_member(witness);
      }
      members.check_pending_member(invitee);

      inductions{get_self()}.initialize_induction(id, inviter, invitee, witnesses);
   }

   void eden::inductprofil(uint64_t id, new_member_profile new_member_profile)
   {
      inductions inductions{get_self()};
      auto induction = inductions.get_induction(id);
      require_auth(induction.invitee);

      members{get_self()}.check_pending_member(induction.invitee);

      inductions.update_profile(induction, new_member_profile);

      globals globals{get_self()};
      if(globals.get().stage == contract_stage::genesis)
      {
         inductions.endorse_all(induction);
      }
   }

   void eden::inductvideo(eosio::name account,
                          uint64_t id,
                          std::string video)
   {
      require_auth(account);
      inductions inductions{get_self()};
      auto induction = inductions.get_induction(id);

      globals{get_self()}.check_active();
      members{get_self()}.check_pending_member(induction.invitee);

      eosio::check(inductions.is_endorser(id, account),
		   "Video can only be set by inviter or a witness");
      inductions.update_video(induction, video);
   }

   void eden::inductendorse(eosio::name account,
                            uint64_t id,
                            eosio::checksum256 induction_data_hash)
   {
      require_auth(account);
      inductions inductions{get_self()};
      const auto& induction = inductions.get_induction(id);

      members{get_self()}.check_pending_member(induction.invitee);

      eosio::check(inductions.is_endorser(id, account),
                   "Induction  can only be endorsed by inviter or a witness");
      inductions.endorse(induction, account, induction_data_hash);
   }

   void eden::inducted(eosio::name inductee)
   {
      eosio::require_auth(get_self());

      members members{get_self()};
      members.set_active(inductee);

      inductions inductions(get_self());
      const auto& induction = inductions.get_endorsed_induction(inductee);
      inductions.erase_induction(induction);

      // If this is the last genesis member, activate the contract
      globals globals{get_self()};
      if(globals.get().stage == contract_stage::genesis)
      {
         if(members.stats().pending_members == 0)
         {
            globals.set_stage(contract_stage::active);
         }
      }
   }

}  // namespace eden
